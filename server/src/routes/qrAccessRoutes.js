import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin } from '../services/companyAccess.js'

const qrAccessRoutes = Router()
const genericNotFound = { error: 'Vehicle access not found' }
const publicAttempts = new Map()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 30

function publicRateLimit(req, res, next) {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const current = publicAttempts.get(key) || { startedAt: now, count: 0 }
  if (now - current.startedAt >= WINDOW_MS) { current.startedAt = now; current.count = 0 }
  current.count += 1
  publicAttempts.set(key, current)
  if (current.count > MAX_ATTEMPTS) return res.status(429).json(genericNotFound)
  return next()
}

async function findPublicToken(token) {
  const { data, error } = await getSupabaseAdminClient().from('vehicles').select('id, company_id, owner_user_id, owner_type').eq('qr_access_token', token).eq('qr_access_enabled', true).maybeSingle()
  if (error) throw error
  return data
}

async function findPrivateVehicle(id, userId) {
  const { data, error } = await getSupabaseAdminClient().from('vehicles').select('id').eq('id', id).eq('owner_type', 'PRIVATE').eq('owner_user_id', userId).is('company_id', null).maybeSingle()
  if (error) throw error
  return data
}

async function setToken(res, next, vehicleId, applyScope) {
  try {
    const token = randomUUID()
    let query = getSupabaseAdminClient().from('vehicles').update({ qr_access_token: token, qr_access_enabled: true, qr_access_updated_at: new Date().toISOString() }).eq('id', vehicleId)
    query = applyScope(query)
    const { data, error } = await query.select('qr_access_token, qr_access_enabled, qr_access_updated_at').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json(genericNotFound)
    return res.json({ token: data.qr_access_token, enabled: data.qr_access_enabled, updatedAt: data.qr_access_updated_at })
  } catch (error) { return next(error) }
}

qrAccessRoutes.get('/public/:token', publicRateLimit, async (req, res, next) => {
  try {
    const vehicle = await findPublicToken(req.params.token)
    if (!vehicle) return res.status(404).json(genericNotFound)
    return res.json({ valid: true })
  } catch (error) { return next(error) }
})

qrAccessRoutes.get('/resolve/:token', requireAuth, async (req, res, next) => {
  try {
    const vehicle = await findPublicToken(req.params.token)
    if (!vehicle) return res.status(404).json(genericNotFound)
    if (vehicle.owner_type === 'PRIVATE') {
      if (vehicle.owner_user_id !== req.user.id) return res.status(404).json(genericNotFound)
      return res.json({ vehicleId: vehicle.id, access: 'PRIVATE' })
    }
    const { data: membership, error } = await getSupabaseAdminClient().from('company_members').select('id').eq('company_id', vehicle.company_id).eq('user_id', req.user.id).maybeSingle()
    if (error) throw error
    if (!membership) return res.status(404).json(genericNotFound)
    return res.json({ vehicleId: vehicle.id, access: 'COMPANY' })
  } catch (error) { return next(error) }
})

qrAccessRoutes.post('/private/vehicles/:id/token', requireAuth, async (req, res, next) => {
  try {
    const vehicle = await findPrivateVehicle(req.params.id, req.user.id)
    if (!vehicle) return res.status(404).json(genericNotFound)
    return setToken(res, next, vehicle.id, (query) => query.eq('owner_user_id', req.user.id).eq('owner_type', 'PRIVATE').is('company_id', null))
  } catch (error) { return next(error) }
})

qrAccessRoutes.delete('/private/vehicles/:id/token', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').update({ qr_access_enabled: false, qr_access_updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('owner_user_id', req.user.id).eq('owner_type', 'PRIVATE').is('company_id', null).select('id').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json(genericNotFound)
    return res.status(204).send()
  } catch (error) { return next(error) }
})

qrAccessRoutes.post('/company/vehicles/:id/token', requireAuth, requireCompanyAdmin, (req, res, next) => setToken(res, next, req.params.id, (query) => query.eq('company_id', req.companyMembership.company_id)))
qrAccessRoutes.delete('/company/vehicles/:id/token', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('vehicles').update({ qr_access_enabled: false, qr_access_updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json(genericNotFound)
    return res.status(204).send()
  } catch (error) { return next(error) }
})

export default qrAccessRoutes
