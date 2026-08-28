import { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin } from '../services/companyAccess.js'

const dashboardRoutes = Router()

function getQueryData(result, query, companyId) {
  if (!result.error) return result.data ?? []

  // Keep enough context in Render logs to diagnose schema/query failures without logging credentials.
  console.error('Dashboard query failed', {
    query,
    companyId,
    code: result.error.code ?? null,
    message: result.error.message ?? 'Unknown Supabase error',
    hint: result.error.hint ?? null,
  })

  const error = new Error(`Dashboard ${query} query failed`)
  error.statusCode = 500
  throw error
}

dashboardRoutes.get('/', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const companyId = req.companyMembership.company_id
    const supabase = getSupabaseAdminClient()
    const [vehiclesResult, allReportsResult, recentReportsResult, notificationsResult] = await Promise.all([
      supabase.from('vehicles').select('id, plate_number, brand, model, created_at').eq('company_id', companyId),
      supabase.from('reports').select('vehicle_id, type, status, priority').eq('company_id', companyId),
      supabase.from('reports').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
      supabase.from('notifications').select('id').eq('company_id', companyId).eq('is_read', false),
    ])

    const vehicles = getQueryData(vehiclesResult, 'vehicles', companyId)
    const reports = getQueryData(allReportsResult, 'reports', companyId)
    const recentReports = getQueryData(recentReportsResult, 'recent reports', companyId)
    const notifications = getQueryData(notificationsResult, 'notifications', companyId)

    const activeStatuses = new Set(['OPEN', 'IN_REPAIR'])
    const activeReports = reports.filter((report) => report.type === 'ISSUE' && activeStatuses.has(report.status))
    const urgentVehicleIds = new Set(activeReports.filter((report) => report.priority === 'URGENT').map((report) => report.vehicle_id))
    const attentionVehicleIds = new Set(activeReports.filter((report) => report.priority !== 'URGENT').map((report) => report.vehicle_id))
    urgentVehicleIds.forEach((vehicleId) => attentionVehicleIds.delete(vehicleId))
    const affectedVehicleIds = new Set([...urgentVehicleIds, ...attentionVehicleIds])
    const totalVehicles = vehicles.length
    const attentionNeeded = attentionVehicleIds.size

    return res.json({
      company: req.companyMembership.companies,
      totalVehicles,
      vehiclesOk: totalVehicles - affectedVehicleIds.size,
      attentionNeeded,
      urgent: urgentVehicleIds.size,
      vehicles,
      recentReports,
      stats: {
        totalVehicles,
        vehiclesOk: totalVehicles - affectedVehicleIds.size,
        attentionNeeded,
        // Retained for the current dashboard client until it consumes attentionNeeded.
        needAttention: attentionNeeded,
        urgent: urgentVehicleIds.size,
        unreadNotifications: notifications.length,
      },
    })
  } catch (error) { return next(error) }
})

export default dashboardRoutes
