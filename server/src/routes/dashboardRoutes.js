import { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin } from '../services/companyAccess.js'

const dashboardRoutes = Router()

dashboardRoutes.get('/', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const companyId = req.companyMembership.company_id
    const supabase = getSupabaseAdminClient()
    const [vehiclesResult, allReportsResult, recentReportsResult, notificationsResult] = await Promise.all([
      supabase.from('vehicles').select('id').eq('company_id', companyId),
      supabase.from('reports').select('vehicle_id, type, status, priority').eq('company_id', companyId),
      supabase.from('reports').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
      supabase.from('notifications').select('id').eq('company_id', companyId).eq('is_read', false),
    ])
    if (vehiclesResult.error) throw vehiclesResult.error
    if (allReportsResult.error) throw allReportsResult.error
    if (recentReportsResult.error) throw recentReportsResult.error
    if (notificationsResult.error) throw notificationsResult.error

    const activeStatuses = new Set(['OPEN', 'IN_REPAIR'])
    const activeReports = allReportsResult.data.filter((report) => report.type === 'ISSUE' && activeStatuses.has(report.status))
    const urgentVehicleIds = new Set(activeReports.filter((report) => report.priority === 'URGENT').map((report) => report.vehicle_id))
    const attentionVehicleIds = new Set(activeReports.filter((report) => report.priority !== 'URGENT').map((report) => report.vehicle_id))
    urgentVehicleIds.forEach((vehicleId) => attentionVehicleIds.delete(vehicleId))
    const affectedVehicleIds = new Set([...urgentVehicleIds, ...attentionVehicleIds])
    return res.json({
      company: req.companyMembership.companies,
      stats: {
        totalVehicles: vehiclesResult.data.length,
        vehiclesOk: vehiclesResult.data.length - affectedVehicleIds.size,
        needAttention: attentionVehicleIds.size,
        urgent: urgentVehicleIds.size,
        unreadNotifications: notificationsResult.data.length,
      },
      recentReports: recentReportsResult.data,
    })
  } catch (error) { return next(error) }
})

export default dashboardRoutes
