import { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin } from '../services/companyAccess.js'

const reminderRoutes = Router()
const types = new Set(['TUV', 'INSURANCE', 'SERVICE', 'OIL_CHANGE', 'TIRE_CHANGE', 'OTHER'])
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

const scope = (query, owner) => owner.companyId ? query.eq('company_id', owner.companyId) : query.is('company_id', null).eq('owner_user_id', owner.userId)
async function vehicleForOwner(vehicleId, owner) {
  let query = getSupabaseAdminClient().from('vehicles').select('id, company_id, owner_user_id, plate_number') .eq('id', vehicleId)
  query = owner.companyId ? query.eq('company_id', owner.companyId) : query.eq('owner_type', 'PRIVATE').eq('owner_user_id', owner.userId).is('company_id', null)
  const { data, error } = await query.maybeSingle(); if (error) throw error; return data
}
function register(ownerPath, middleware, owner) {
  const base = `/${ownerPath}`
  reminderRoutes.get(base, requireAuth, middleware, async (req, res, next) => { try { let query = getSupabaseAdminClient().from('vehicle_reminders').select('*, vehicles(plate_number, brand, model)').order('due_date'); query = scope(query, owner(req)); const vehicleId = req.query.vehicleId; if (vehicleId) query = query.eq('vehicle_id', vehicleId); const { data, error } = await query; if (error) throw error; res.json({ reminders: data }) } catch (error) { next(error) } })
  reminderRoutes.post(base, requireAuth, middleware, async (req, res, next) => { const { vehicleId, reminderType, dueDate, note } = req.body || {}; if (!vehicleId || !types.has(reminderType) || !validDate(dueDate)) return res.status(400).json({ error: 'Vehicle, reminder type, and due date are required' }); try { const ownedVehicle = await vehicleForOwner(vehicleId, owner(req)); if (!ownedVehicle) return res.status(404).json({ error: 'Vehicle not found' }); const { data, error } = await getSupabaseAdminClient().from('vehicle_reminders').insert({ vehicle_id: vehicleId, company_id: owner(req).companyId || null, owner_user_id: owner(req).userId || null, reminder_type: reminderType, due_date: dueDate, note: note?.trim() || null, created_by: req.user.id }).select('*, vehicles(plate_number, brand, model)').single(); if (error) throw error; res.status(201).json({ reminder: data }) } catch (error) { next(error) } })
  reminderRoutes.put(`${base}/:id`, requireAuth, middleware, async (req, res, next) => { const { reminderType, dueDate, note } = req.body || {}; if (!types.has(reminderType) || !validDate(dueDate)) return res.status(400).json({ error: 'Reminder type and due date are required' }); try { const { data, error } = await scope(getSupabaseAdminClient().from('vehicle_reminders').update({ reminder_type: reminderType, due_date: dueDate, note: note?.trim() || null }).eq('id', req.params.id), owner(req)).select('*, vehicles(plate_number, brand, model)').maybeSingle(); if (error) throw error; if (!data) return res.status(404).json({ error: 'Reminder not found' }); res.json({ reminder: data }) } catch (error) { next(error) } })
  reminderRoutes.patch(`${base}/:id/complete`, requireAuth, middleware, async (req, res, next) => { try { const { data, error } = await scope(getSupabaseAdminClient().from('vehicle_reminders').update({ status: 'COMPLETED' }).eq('id', req.params.id), owner(req)).select('*, vehicles(plate_number, brand, model)').maybeSingle(); if (error) throw error; if (!data) return res.status(404).json({ error: 'Reminder not found' }); res.json({ reminder: data }) } catch (error) { next(error) } })
  reminderRoutes.delete(`${base}/:id`, requireAuth, middleware, async (req, res, next) => { try { const { data, error } = await scope(getSupabaseAdminClient().from('vehicle_reminders').delete().eq('id', req.params.id), owner(req)).select('id').maybeSingle(); if (error) throw error; if (!data) return res.status(404).json({ error: 'Reminder not found' }); res.status(204).send() } catch (error) { next(error) } })
}
register('company', requireCompanyAdmin, (req) => ({ companyId: req.companyMembership.company_id }))
register('private', (req, res, next) => next(), (req) => ({ userId: req.user.id }))
export default reminderRoutes
