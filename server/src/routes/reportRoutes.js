import { Router } from 'express'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin, requireCompanyMember } from '../services/companyAccess.js'
import { getSupabaseAdminClient } from '../config/supabase.js'

const reportRoutes = Router()
const issueTypes = new Set(['TIRE', 'FUEL', 'ADBLUE', 'OIL_SERVICE', 'LIGHTS', 'DAMAGE', 'WARNING_LIGHT', 'ACCIDENT', 'OTHER', 'TIRES_WHEELS', 'ENGINE', 'BRAKES', 'BODY_DAMAGE', 'INTERIOR', 'FLUID_OIL'])
const statuses = new Set(['OPEN', 'IN_REPAIR', 'RESOLVED'])
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

async function getCompanyVehicle(vehicleId, companyId) {
  const { data, error } = await getSupabaseAdminClient().from('vehicles').select('id, company_id, plate_number').eq('id', vehicleId).eq('company_id', companyId).maybeSingle()
  if (error) throw error
  return data
}

reportRoutes.post('/upload', requireAuth, requireCompanyMember, express.raw({ type: () => true, limit: '50mb' }), async (req, res, next) => {
  const vehicleId = req.get('x-vehicle-id')
  const reportId = req.get('x-report-id') || randomUUID()
  const mimeType = req.get('content-type')?.split(';')[0].toLowerCase()
  const rule = mediaRules[mimeType]
  if (!vehicleId || !uuidPattern.test(reportId) || !rule) return res.status(400).json({ error: 'A valid vehicle, report ID, and supported media type are required' })
  if (!Buffer.isBuffer(req.body) || !req.body.length || req.body.length > rule.maxBytes) return res.status(400).json({ error: 'Media file is empty or exceeds the size limit' })
  try {
    const vehicle = await getCompanyVehicle(vehicleId, req.companyMembership.company_id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    const filename = `media.${rule.extension}`
    const mediaPath = `${vehicle.company_id}/${vehicle.id}/${reportId}/${filename}`
    const { error } = await getSupabaseAdminClient().storage.from('vehicle-reports').upload(mediaPath, req.body, { contentType: mimeType, upsert: false })
    if (error) throw error
    return res.status(201).json({ reportId, mediaPath, mediaType: mimeType.startsWith('image/') ? 'image' : 'video' })
  } catch (error) { return next(error) }
})

reportRoutes.get('/', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('reports').select('*').eq('company_id', req.companyMembership.company_id).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ reports: data })
  } catch (error) { return next(error) }
})

reportRoutes.get('/:id', requireAuth, requireCompanyMember, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('reports').select('*').eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Report not found' })
    return res.json({ report: data })
  } catch (error) { return next(error) }
})

reportRoutes.get('/:id/media', requireAuth, requireCompanyMember, async (req, res, next) => {
  try {
    const { data: report, error } = await getSupabaseAdminClient().from('reports').select('media_path, media_type').eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).maybeSingle()
    if (error) throw error
    if (!report?.media_path) return res.status(404).json({ error: 'Report media not found' })
    const { data, error: signedUrlError } = await getSupabaseAdminClient().storage.from('vehicle-reports').createSignedUrl(report.media_path, 3600)
    if (signedUrlError) throw signedUrlError
    return res.json({ signedUrl: data.signedUrl, mediaType: report.media_type })
  } catch (error) { return next(error) }
})

reportRoutes.post('/', requireAuth, requireCompanyMember, async (req, res, next) => {
  const { id, vehicleId, employeeName, type, issueType, description, priority, mediaType, mediaPath } = req.body || {}
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
    const vehicle = await getCompanyVehicle(vehicleId, req.companyMembership.company_id)
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    if (mediaPath && (!id || !mediaPath.startsWith(`${vehicle.company_id}/${vehicle.id}/${id}/`))) return res.status(400).json({ error: 'Media path does not belong to this report' })
    const reportPayload = { ...(id ? { id } : {}), company_id: vehicle.company_id, vehicle_id: vehicle.id, created_by: req.user.id, employee_name: employeeName?.trim() || null, type: normalizedType, issue_type: normalizedType === 'ISSUE' ? normalizedIssueType : null, description: description?.trim() || null, priority: normalizedType === 'ISSUE' ? normalizedPriority || 'ATTENTION' : null, status: normalizedType === 'ISSUE' ? 'OPEN' : 'OK', media_type: mediaType || null, media_path: mediaPath || null }
    const { data: report, error: reportError } = await getSupabaseAdminClient().from('reports').insert(reportPayload).select('*').single()
    if (reportError) throw reportError
    if (normalizedType === 'ISSUE') {
      const title = `Vehicle ${vehicle.plate_number}`
      const message = `New ${normalizedIssueType.replaceAll('_', ' ').toLowerCase()} issue${employeeName?.trim() ? ` reported by ${employeeName.trim()}` : ' reported'}`
      const { error: notificationError } = await getSupabaseAdminClient().from('notifications').insert({ company_id: vehicle.company_id, report_id: report.id, vehicle_id: vehicle.id, type: 'NEW_ISSUE', title, message })
      if (notificationError) {
        await getSupabaseAdminClient().from('reports').delete().eq('id', report.id).eq('company_id', vehicle.company_id)
        throw notificationError
      }
    }
    return res.status(201).json({ report })
  } catch (error) { return next(error) }
})

reportRoutes.patch('/:id/status', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  const status = typeof req.body?.status === 'string' ? req.body.status.toUpperCase() : ''
  if (!statuses.has(status)) return res.status(400).json({ error: 'Status must be OPEN, IN_REPAIR, or RESOLVED' })
  try {
    const { data, error } = await getSupabaseAdminClient().from('reports').update({ status }).eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).eq('type', 'ISSUE').select('*').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Issue report not found' })
    return res.json({ report: data })
  } catch (error) { return next(error) }
})

export default reportRoutes
