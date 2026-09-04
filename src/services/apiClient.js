const configuredApiUrl = import.meta.env.VITE_API_URL
const API_URL = (configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:4000/api' : '')).replace(/\/$/, '')
const COMPANY_SESSION_KEY = 'fleetcheck_company'
const PRIVATE_SESSION_KEY = 'fleetcheck_private'
const REQUEST_TIMEOUT_MS = 45000

function getAccessToken() {
  try {
    return JSON.parse(localStorage.getItem(COMPANY_SESSION_KEY) || 'null')?.accessToken
      || JSON.parse(localStorage.getItem(PRIVATE_SESSION_KEY) || 'null')?.accessToken
      || null
  } catch {
    return null
  }
}

function getActiveCompanyId() {
  try {
    const session = JSON.parse(localStorage.getItem(COMPANY_SESSION_KEY) || 'null')
    return session?.activeCompanyId || session?.companyId || null
  } catch {
    return null
  }
}

export async function apiRequest(path, options = {}) {
  if (!API_URL) throw new Error('serverConnectionFailed')
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const companyId = getActiveCompanyId()
  if (companyId && !headers.has('X-Company-Id')) headers.set('X-Company-Id', companyId)
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof Blob)) headers.set('Content-Type', 'application/json')
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal })
  } catch {
    throw new Error('serverConnectionFailed')
  } finally {
    window.clearTimeout(timeout)
  }
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(COMPANY_SESSION_KEY)
      localStorage.removeItem(PRIVATE_SESSION_KEY)
      window.dispatchEvent(new Event('fleetcheck-auth-expired'))
    }
    throw new Error(data?.error || 'Unable to complete this request')
  }
  return data
}

export const apiUrl = API_URL
