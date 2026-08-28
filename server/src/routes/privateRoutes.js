import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import express, { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const privateRoutes = Router()
const issueTypes = new Set(['TIRE', 'FUEL', 'ADBLUE', 'OIL_SERVICE', 'LIGHTS', 'DAMAGE', 'WARNING_LIGHT', 'ACCIDENT', 'OTHER', 'TIRES_WHEELS', 'ENGINE', 'BRAKES', 'BODY_DAMAGE', 'INTERIOR', 'FLUID_OIL'])
const priorities = new Set(['ATTENTION', 'URGENT'])
const mediaRules = {
  'image/jpeg': { extension: 'jpg', maxBytes: 10 * 1024 * 1024 },
  'image/png': { extension: 'png', maxBytes: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maxBytes: 10 * 1024 * 1024 },
  'image/heic': { extension: 'heic', maxBytes: 10 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', maxBytes: 50 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', maxBytes: 50 * 1024 * 1024 },
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const normalizePlate = (value) => value?.trim().toUpperCase().replace(/\s+/g, ' ')
const validYear = (value) => value === undefined || value === null || value === '' || (Number.isInteger(value) && value >= 1886 && value <= 2100)

function logPrivateDatabaseError(operation, error, { userId, vehicleId, reportId } = {}) {
  console.error('Private API database error', { operation, userId: userId ?? null, vehicleId: vehicleId ?? null, reportId: reportId ?? null, code: error?.code ?? null, message: error?.message ?? 'Unknown Supabase error', hint: error?.hint ?? null })
}

async function getPrivateVehicle(vehicleId, userId) {
  const { data, error } = await getSupabaseAdminClient().from('vehicles').select('*').eq('id', vehicleId).eq('owner_type', 'PRIVATE').eq('owner_user_id', userId).is('company_id', null).maybeSingle()
  if (error) throw error
  return data
}

privateRoutes.use(requireAuth)

privateRoutes.get('/vehicles', async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').select('*').eq('owner_type', 'PRIVATE').eq('owner_user_id', req.user.id).is('company_id', null).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ vehicles: data })
  } catch (error) {
    logPrivateDatabaseError('list vehicles', error, { userId: req.user.id })
    return next(error)
  }
})

privateRoutes.post('/vehicles', async (req, res, next) => {
  const { plateNumber, brand, model, year, vehicleType } = req.body || {}
  const plate = normalizePlate(plateNumber)
  if (!plate || !brand?.trim() || !model?.trim()) return res.status(400).json({ error: 'Plate number, brand, and model are required' })
  if (!validYear(year)) return res.status(400).json({ error: 'Year is invalid' })
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').insert({ company_id: null, owner_user_id: req.user.id, owner_type: 'PRIVATE', plate_number: plate, brand: brand.trim(), model: model.trim(), year: year || null, vehicle_type: vehicleType?.trim() || null }).select('*').single()
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A vehicle with this plate already exists' })
      throw error
    }
    return res.status(201).json({ vehicle: data })
  } catch (error) {
    logPrivateDatabaseError('create vehicle', error, { userId: req.user.id })
    return next(error)
  }
})

privateRoutes.get('/vehicles/:id', async (req, res, next) => {
  try {
    const vehicle = await getPrivateVehicle(req.params.id, req.user.id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    return res.json({ vehicle })
  } catch (error) {
    logPrivateDatabaseError('get vehicle', error, { userId: req.user.id, vehicleId: req.params.id })
    return next(error)
  }
})

privateRoutes.put('/vehicles/:id', async (req, res, next) => {
  const { plateNumber, brand, model, year, vehicleType } = req.body || {}
  if (plateNumber !== undefined && !normalizePlate(plateNumber)) return res.status(400).json({ error: 'Plate number is invalid' })
  if (brand !== undefined && !brand?.trim()) return res.status(400).json({ error: 'Brand is invalid' })
  if (model !== undefined && !model?.trim()) return res.status(400).json({ error: 'Model is invalid' })
  if (!validYear(year)) return res.status(400).json({ error: 'Year is invalid' })
  const updates = Object.fromEntries(Object.entries({ plate_number: plateNumber === undefined ? undefined : normalizePlate(plateNumber), brand: brand?.trim(), model: model === undefined ? undefined : model.trim(), year: year === undefined ? undefined : year || null, vehicle_type: vehicleType === undefined ? undefined : vehicleType?.trim() || null }).filter(([, value]) => value !== undefined))
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No vehicle updates provided' })
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').update(updates).eq('id', req.params.id).eq('owner_type', 'PRIVATE').eq('owner_user_id', req.user.id).is('company_id', null).select('*').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Vehicle not found' })
    return res.json({ vehicle: data })
  } catch (error) {
    logPrivateDatabaseError('update vehicle', error, { userId: req.user.id, vehicleId: req.params.id })
    return next(error)
  }
})

privateRoutes.get('/vehicles/:id/history', async (req, res, next) => {
  try {
    const vehicle = await getPrivateVehicle(req.params.id, req.user.id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    const { data: reports, error } = await getSupabaseAdminClient().from('reports').select('*').eq('vehicle_id', vehicle.id).is('company_id', null).eq('created_by', req.user.id).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ vehicle, reports })
  } catch (error) {
    logPrivateDatabaseError('get vehicle history', error, { userId: req.user.id, vehicleId: req.params.id })
    return next(error)
  }
})

privateRoutes.post('/reports/upload', express.raw({ type: () => true, limit: '50mb' }), async (req, res, next) => {
  const vehicleId = req.get('x-vehicle-id')
  const reportId = req.get('x-report-id') || randomUUID()
  const mimeType = req.get('content-type')?.split(';')[0].toLowerCase()
  const rule = mediaRules[mimeType]
  if (!vehicleId || !uuidPattern.test(reportId) || !rule) return res.status(400).json({ error: 'A valid vehicle, report ID, and supported media type are required' })
  if (!Buffer.isBuffer(req.body) || !req.body.length || req.body.length > rule.maxBytes) return res.status(400).json({ error: 'Media file is empty or exceeds the size limit' })
  try {
    const vehicle = await getPrivateVehicle(vehicleId, req.user.id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    const mediaPath = `${req.user.id}/${vehicle.id}/${reportId}/media.${rule.extension}`
    const { error } = await getSupabaseAdminClient().storage.from('vehicle-reports').upload(mediaPath, req.body, { contentType: mimeType, upsert: false })
    if (error) throw error
    return res.status(201).json({ reportId, mediaPath, mediaType: mimeType.startsWith('image/') ? 'image' : 'video' })
  } catch (error) {
    logPrivateDatabaseError('upload report media', error, { userId: req.user.id, vehicleId, reportId })
    return next(error)
  }
})

privateRoutes.post('/reports', async (req, res, next) => {
  const { id, vehicleId, type, issueType, description, priority, mediaType, mediaPath } = req.body || {}
  const normalizedType = typeof type === 'string' ? type.toUpperCase() : ''
  const normalizedIssueType = typeof issueType === 'string' ? issueType.toUpperCase() : null
  const normalizedPriority = typeof priority === 'string' ? priority.toUpperCase() : null
  if (!vehicleId || !['VEHICLE_OK', 'ISSUE'].includes(normalizedType)) return res.status(400).json({ error: 'Vehicle ID and report type are required' })
  if (normalizedType === 'ISSUE' && !issueTypes.has(normalizedIssueType)) return res.status(400).json({ error: 'A valid issue type is required' })
  if (normalizedType === 'ISSUE' && normalizedPriority && !priorities.has(normalizedPriority)) return res.status(400).json({ error: 'Priority must be ATTENTION or URGENT' })
  if (mediaType && !['image', 'video'].includes(mediaType)) return res.status(400).json({ error: 'Media type is invalid' })
  if (mediaPath && (typeof mediaPath !== 'string' || mediaPath.startsWith('data:'))) return res.status(400).json({ error: 'Media must be stored in approved storage' })
  if (id && (typeof id !== 'string' || !uuidPattern.test(id))) return res.status(400).json({ error: 'Report ID is invalid' })
  try {
    const vehicle = await getPrivateVehicle(vehicleId, req.user.id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    if (mediaPath && (!id || !mediaPath.startsWith(`${req.user.id}/${vehicle.id}/${id}/`))) return res.status(400).json({ error: 'Media path does not belong to this report' })
    const payload = { ...(id ? { id } : {}), company_id: null, vehicle_id: vehicle.id, created_by: req.user.id, employee_name: null, type: normalizedType, issue_type: normalizedType === 'ISSUE' ? normalizedIssueType : null, description: description?.trim() || null, priority: normalizedType === 'ISSUE' ? normalizedPriority || 'ATTENTION' : null, status: normalizedType === 'ISSUE' ? 'OPEN' : 'OK', media_type: mediaType || null, media_path: mediaPath || null }
    const { data: report, error } = await getSupabaseAdminClient().from('reports').insert(payload).select('*').single()
    if (error) throw error
    return res.status(201).json({ report })
  } catch (error) {
    logPrivateDatabaseError('create report', error, { userId: req.user.id, vehicleId, reportId: id ?? null })
    return next(error)
  }
})

privateRoutes.get('/reports/:id/media', async (req, res, next) => {
  try {
    const { data: report, error } = await getSupabaseAdminClient().from('reports').select('media_path, media_type').eq('id', req.params.id).is('company_id', null).eq('created_by', req.user.id).maybeSingle()
    if (error) throw error
    if (!report?.media_path) return res.status(404).json({ error: 'Report media not found' })
    const { data, error: signedUrlError } = await getSupabaseAdminClient().storage.from('vehicle-reports').createSignedUrl(report.media_path, 3600)
    if (signedUrlError) throw signedUrlError
    return res.json({ signedUrl: data.signedUrl, mediaType: report.media_type })
  } catch (error) {
    logPrivateDatabaseError('get report media', error, { userId: req.user.id, reportId: req.params.id })
    return next(error)
  }
})

export default privateRoutes
