import { getSupabaseAdminClient } from '../config/supabase.js'

export async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const { data, error } = await getSupabaseAdminClient().auth.getUser(token)
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid authentication token' })
    }
    req.user = data.user
    return next()
  } catch (error) {
    if (error.statusCode === 503) {
      return res.status(503).json({ error: 'Authentication service is not configured' })
    }
    return res.status(401).json({ error: 'Invalid authentication token' })
  }
}
