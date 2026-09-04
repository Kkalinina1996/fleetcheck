import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { getSupabaseAdminClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const authRoutes = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const safeUser = (user) => ({ id: user.id, email: user.email ?? null })
const safeSession = (session) => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  expiresAt: session.expires_at,
  expiresIn: session.expires_in,
  tokenType: session.token_type,
})

function validateRegistration({ companyName, adminName, email, password }) {
  if (!companyName?.trim()) return 'Company name is required'
  if (!adminName?.trim()) return 'Admin name is required'
  if (!emailPattern.test(email || '')) return 'A valid email address is required'
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters'
  return null
}

function validatePrivateRegistration({ fullName, email, password }) {
  if (!fullName?.trim()) return 'Name is required'
  if (!emailPattern.test(email || '')) return 'A valid email address is required'
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters'
  return null
}

authRoutes.post('/register-company', async (req, res, next) => {
  const validationError = validateRegistration(req.body || {})
  if (validationError) return res.status(400).json({ error: validationError })

  const { companyName, adminName, email, password, phone } = req.body
  let createdUserId
  let createdCompanyId

  try {
    const supabase = getSupabaseAdminClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return res.status(400).json({ error: 'Unable to create company account' })
    }

    createdUserId = authData.user.id
    const companyId = randomUUID()
    createdCompanyId = companyId
    const { error: profileError } = await supabase.from('profiles').insert({
      id: createdUserId,
      full_name: adminName.trim(),
    })
    if (profileError) throw profileError

    const { error: companyError } = await supabase.from('companies').insert({
      id: companyId,
      name: companyName.trim(),
      phone: phone?.trim() || null,
    })
    if (companyError) throw companyError

    const { error: membershipError } = await supabase.from('company_members').insert({
      id: randomUUID(),
      company_id: companyId,
      user_id: createdUserId,
      role: 'COMPANY_ADMIN',
    })
    if (membershipError) throw membershipError

    return res.status(201).json({
      user: safeUser(authData.user),
      company: { id: companyId, name: companyName.trim() },
      role: 'COMPANY_ADMIN',
    })
  } catch (error) {
    if (createdCompanyId) {
      try {
        await getSupabaseAdminClient().from('companies').delete().eq('id', createdCompanyId)
      } catch {
        // Cleanup is best-effort; operators can reconcile rare orphaned records.
      }
    }
    if (createdUserId) {
      try {
        await getSupabaseAdminClient().auth.admin.deleteUser(createdUserId)
      } catch {
        // Cleanup is best-effort; operators can reconcile rare orphaned records.
      }
    }
    return next(error)
  }
})

authRoutes.post('/register-private', async (req, res, next) => {
  const validationError = validatePrivateRegistration(req.body || {})
  if (validationError) return res.status(400).json({ error: validationError })

  const { fullName, email, password } = req.body
  let createdUserId
  try {
    const supabase = getSupabaseAdminClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })
    if (authError || !authData.user) return res.status(400).json({ error: 'Unable to create private account' })

    createdUserId = authData.user.id
    const { error: profileError } = await supabase.from('profiles').insert({
      id: createdUserId,
      full_name: fullName.trim(),
    })
    if (profileError) throw profileError
    return res.status(201).json({ user: safeUser(authData.user), profile: { id: createdUserId, fullName: fullName.trim() } })
  } catch (error) {
    if (createdUserId) {
      try {
        await getSupabaseAdminClient().auth.admin.deleteUser(createdUserId)
      } catch {
        // Cleanup is best-effort; operators can reconcile rare orphaned auth users.
      }
    }
    return next(error)
  }
})

authRoutes.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {}
  if (!emailPattern.test(email || '') || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const { data, error } = await getSupabaseAdminClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user || !data.session) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    return res.json({ user: safeUser(data.user), session: safeSession(data.session) })
  } catch (error) {
    return next(error)
  }
})

authRoutes.get('/me', requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient()
    const requestedCompanyId = req.get('x-company-id') || null
    const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, created_at').eq('id', req.user.id).maybeSingle(),
      supabase.from('company_members').select('company_id, role, companies(id, name, phone)').eq('user_id', req.user.id),
    ])
    if (profileError) throw profileError
    if (membershipError) throw membershipError

    const availableMemberships = (memberships || []).map((membership) => ({
      companyId: membership.company_id,
      company: membership.companies,
      role: membership.role,
    }))
    const membership = requestedCompanyId
      ? availableMemberships.find((item) => item.companyId === requestedCompanyId) || null
      : availableMemberships.length === 1 ? availableMemberships[0] : null
    return res.json({
      user: safeUser(req.user),
      profile: profile || null,
      company: membership?.company || null,
      role: membership?.role || null,
      memberships: availableMemberships,
    })
  } catch (error) {
    return next(error)
  }
})

export default authRoutes
