import { clearAdminSession, clearCompanySession as clearStoredCompanySession, clearDriverSession as clearStoredDriverSession, clearPrivateSession as clearStoredPrivateSession, getCompanySession as getStoredCompanySession, getDriverSession as getStoredDriverSession, getPrivateSession as getStoredPrivateSession, hasAdminSession, hasDriverSession as hasStoredDriverSession, saveCompanySession as saveStoredCompanySession, saveDriverSession as saveStoredDriverSession, savePrivateSession as saveStoredPrivateSession, setAdminSession } from '../lib/storage'
import { apiRequest } from './apiClient'

export const getDriverSession = () => getStoredDriverSession()
export const saveDriverSession = (session) => saveStoredDriverSession(session)
export const clearDriverSession = () => clearStoredDriverSession()
export const hasDriverSession = (vehicleId) => hasStoredDriverSession(vehicleId)
export const isAdminLoggedIn = () => hasAdminSession()
export const loginAdmin = () => setAdminSession()
export const logoutAdmin = () => clearAdminSession()
export const getCompanySession = () => getStoredCompanySession()
export const saveCompanySession = (session) => saveStoredCompanySession(session)
export const saveAuthenticatedCompanySession = ({ user, profile, company, role, session }) => { clearStoredPrivateSession(); saveStoredCompanySession({ companyId: company?.id, companyName: company?.name, user, profile, role, accessToken: session?.accessToken, refreshToken: session?.refreshToken, expiresAt: session?.expiresAt }) }
export const clearCompanySession = () => { clearAdminSession(); clearStoredCompanySession() }
export const isCompanyLoggedIn = () => Boolean(getStoredCompanySession()?.companyId || getStoredCompanySession()?.id)
export async function restoreCompanySession() {
  const session = getStoredCompanySession()
  if (!session?.accessToken) return null
  try {
    const data = await apiRequest('/auth/me')
    saveAuthenticatedCompanySession({ ...data, session })
    return data
  } catch {
    clearCompanySession()
    return null
  }
}

export const getPrivateSession = () => getStoredPrivateSession()
export const isPrivateLoggedIn = () => Boolean(getStoredPrivateSession()?.user?.id && getStoredPrivateSession()?.accessToken)
export const saveAuthenticatedPrivateSession = ({ user, profile, session }) => { clearStoredCompanySession(); saveStoredPrivateSession({ user, profile, accessToken: session?.accessToken, refreshToken: session?.refreshToken, expiresAt: session?.expiresAt }) }
export const clearPrivateSession = () => clearStoredPrivateSession()
export async function restorePrivateSession() {
  const session = getStoredPrivateSession()
  if (!session?.accessToken) return null
  try {
    const data = await apiRequest('/auth/me')
    if (data.company) throw new Error('Company session')
    saveAuthenticatedPrivateSession({ ...data, session })
    return data
  } catch {
    clearPrivateSession()
    return null
  }
}
