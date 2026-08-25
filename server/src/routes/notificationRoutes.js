import { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin } from '../services/companyAccess.js'

const notificationRoutes = Router()

notificationRoutes.get('/', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('notifications').select('*').eq('company_id', req.companyMembership.company_id).order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ notifications: data })
  } catch (error) { return next(error) }
})

notificationRoutes.patch('/read-all', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { error } = await getSupabaseAdminClient().from('notifications').update({ is_read: true }).eq('company_id', req.companyMembership.company_id).eq('is_read', false)
    if (error) throw error
    return res.json({ ok: true })
  } catch (error) { return next(error) }
})

notificationRoutes.patch('/:id/read', requireAuth, requireCompanyAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('company_id', req.companyMembership.company_id).select('*').maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Notification not found' })
    return res.json({ notification: data })
  } catch (error) { return next(error) }
})

export default notificationRoutes
