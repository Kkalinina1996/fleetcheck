import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin, requireCompanyMember } from '../services/companyAccess.js'
import { getSupabaseAdminClient } from '../config/supabase.js'

const vehicleRoutes = Router()
const normalizePlate = (value) => value?.trim().toUpperCase().replace(/\s+/g, ' ')
const validYear = (value) => value === undefined || value === null || value === '' || (Number.isInteger(value) && value >= 1886 && value <= 2100)

async function getCompanyVehicle(id, companyId) {
  const { data, error } = await getSupabaseAdminClient().from('vehicles').select('*').eq('id', id).eq('company_id', companyId).maybeSingle()
  if (error) throw error
  return data
}

vehicleRoutes.get('/', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').select('*').eq('company_id', req.companyMembership.company_id).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ vehicles: data })
  } catch (error) { return next(error) }
})

vehicleRoutes.get('/:id', requireAuth, requireCompanyMember, async (req, res, next) => {
  try {
    const vehicle = await getCompanyVehicle(req.params.id, req.companyMembership.company_id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    return res.json({ vehicle })
  } catch (error) { return next(error) }
})

vehicleRoutes.post('/', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  const { plateNumber, brand, model, year, vehicleType } = req.body || {}
  const plate = normalizePlate(plateNumber)
  if (!plate || !brand?.trim()) return res.status(400).json({ error: 'Plate number and brand are required' })
  if (!validYear(year)) return res.status(400).json({ error: 'Year is invalid' })
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').insert({ company_id: req.companyMembership.company_id, owner_type: 'COMPANY', plate_number: plate, brand: brand.trim(), model: model?.trim() || null, year: year || null, vehicle_type: vehicleType?.trim() || null }).select('*').single()
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A vehicle with this plate already exists' })
      throw error
    }
    return res.status(201).json({ vehicle: data })
  } catch (error) { return next(error) }
})

vehicleRoutes.put('/:id', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  const { plateNumber, brand, model, year, vehicleType } = req.body || {}
  if (plateNumber !== undefined && !normalizePlate(plateNumber)) return res.status(400).json({ error: 'Plate number is invalid' })
  if (brand !== undefined && !brand?.trim()) return res.status(400).json({ error: 'Brand is invalid' })
  if (!validYear(year)) return res.status(400).json({ error: 'Year is invalid' })
  const updates = Object.fromEntries(Object.entries({ plate_number: plateNumber === undefined ? undefined : normalizePlate(plateNumber), brand: brand?.trim(), model: model === undefined ? undefined : model?.trim() || null, year: year === undefined ? undefined : year || null, vehicle_type: vehicleType === undefined ? undefined : vehicleType?.trim() || null }).filter(([, value]) => value !== undefined))
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No vehicle updates provided' })
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').update(updates).eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).select('*').maybeSingle()
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A vehicle with this plate already exists' })
      throw error
    }
    if (!data) return res.status(404).json({ error: 'Vehicle not found' })
    return res.json({ vehicle: data })
  } catch (error) { return next(error) }
})

vehicleRoutes.delete('/:id', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').delete().eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Vehicle not found' })
    return res.status(204).send()
  } catch (error) { return next(error) }
})

vehicleRoutes.get('/:id/history', requireAuth, requireCompanyMember, async (req, res, next) => {
  try {
    const vehicle = await getCompanyVehicle(req.params.id, req.companyMembership.company_id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    const { data: reports, error } = await getSupabaseAdminClient().from('reports').select('*').eq('vehicle_id', vehicle.id).eq('company_id', req.companyMembership.company_id).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ vehicle, reports })
  } catch (error) { return next(error) }
})

vehicleRoutes.get('/:id/issues', requireAuth, requireCompanyMember, async (req, res, next) => {
  try {
    const vehicle = await getCompanyVehicle(req.params.id, req.companyMembership.company_id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    const { data: reports, error } = await getSupabaseAdminClient().from('reports').select('*').eq('vehicle_id', vehicle.id).eq('company_id', req.companyMembership.company_id).in('status', ['OPEN', 'IN_REPAIR']).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ issues: reports })
  } catch (error) { return next(error) }
})

export default vehicleRoutes
