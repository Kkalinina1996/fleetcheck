import { getSupabaseAdminClient } from '../config/supabase.js'

export async function resolveCompanyMembership(req, roles = []) {
  const requestedCompanyId = req.get('x-company-id') || null
  let query = getSupabaseAdminClient()
    .from('company_members')
    .select('company_id, user_id, role, companies(id, name, phone)')
    .eq('user_id', req.user.id)

  if (requestedCompanyId) query = query.eq('company_id', requestedCompanyId)
  if (roles.length) query = query.in('role', roles)

  const { data, error } = await query.limit(2)
  if (error) throw error
  if (!data?.length) return null
  if (!requestedCompanyId && data.length > 1) {
    const error = new Error('Select a company before using this endpoint')
    error.statusCode = 400
    throw error
  }
  return data[0]
}

export async function requireCompanyRole(req, res, next, roles) {
  try {
    const membership = await resolveCompanyMembership(req, roles)
    if (!membership) return res.status(403).json({ error: 'Company access required' })
    req.companyMembership = membership
    return next()
  } catch (error) {
    return next(error)
  }
}

export const requireCompanyAdmin = (req, res, next) => requireCompanyRole(req, res, next, ['COMPANY_ADMIN'])
export const requireCompanyMember = (req, res, next) => requireCompanyRole(req, res, next, ['COMPANY_ADMIN', 'EMPLOYEE'])
