import { Router } from 'express'
import process from 'node:process'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireCompanyAdmin } from '../services/companyAccess.js'

const employeeRoutes = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeEmployee(member, profile, authUser) {
  return {
    userId: member.user_id,
    fullName: profile?.full_name || null,
    email: authUser?.email || null,
    createdAt: member.created_at,
  }
}

async function listAuthUsers(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users || []
}

employeeRoutes.use(requireAuth, requireCompanyAdmin)

employeeRoutes.get('/', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient()
    const [{ data: members, error: memberError }, authUsers] = await Promise.all([
      supabase.from('company_members').select('user_id, created_at').eq('company_id', req.companyMembership.company_id).eq('role', 'EMPLOYEE').order('created_at'),
      listAuthUsers(supabase),
    ])
    if (memberError) throw memberError
    const userIds = members.map((member) => member.user_id)
    const { data: profiles, error: profileError } = userIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
      : { data: [], error: null }
    if (profileError) throw profileError
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
    const usersById = new Map(authUsers.map((user) => [user.id, user]))
    return res.json({ employees: members.map((member) => safeEmployee(member, profilesById.get(member.user_id), usersById.get(member.user_id))) })
  } catch (error) {
    return next(error)
  }
})

employeeRoutes.post('/', async (req, res, next) => {
  const fullName = req.body?.fullName?.trim()
  const email = req.body?.email?.trim().toLowerCase()
  if (!fullName || !emailPattern.test(email || '')) return res.status(400).json({ error: 'Employee name and a valid email address are required' })

  let invitedUserId = null
  try {
    const supabase = getSupabaseAdminClient()
    const existingUser = (await listAuthUsers(supabase)).find((user) => user.email?.toLowerCase() === email)
    let user = existingUser
    if (!user) {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: `${frontendUrl}/company/driver/login`,
      })
      if (error || !data.user) return res.status(400).json({ error: 'Unable to invite employee' })
      user = data.user
      invitedUserId = user.id
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile) {
      const { error } = await supabase.from('profiles').insert({ id: user.id, full_name: fullName })
      if (error) throw error
    }

    const { data: member, error: memberError } = await supabase.from('company_members')
      .insert({ company_id: req.companyMembership.company_id, user_id: user.id, role: 'EMPLOYEE' })
      .select('user_id, created_at')
      .single()
    if (memberError) {
      if (memberError.code === '23505') return res.status(409).json({ error: 'This employee already has access to the company' })
      throw memberError
    }
    return res.status(201).json({ employee: safeEmployee(member, profile || { full_name: fullName }, user), invited: !existingUser })
  } catch (error) {
    if (invitedUserId) {
      await getSupabaseAdminClient().auth.admin.deleteUser(invitedUserId).catch(() => {})
    }
    return next(error)
  }
})

employeeRoutes.delete('/:userId', async (req, res, next) => {
  try {
    const { data, error } = await getSupabaseAdminClient().from('company_members').delete()
      .eq('company_id', req.companyMembership.company_id)
      .eq('user_id', req.params.userId)
      .eq('role', 'EMPLOYEE')
      .select('user_id')
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Employee access not found' })
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

export default employeeRoutes
