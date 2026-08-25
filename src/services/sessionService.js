import { clearAdminSession, clearCompanySession as clearStoredCompanySession, clearDriverSession as clearStoredDriverSession, getCompanySession as getStoredCompanySession, getDriverSession as getStoredDriverSession, hasAdminSession, hasDriverSession as hasStoredDriverSession, saveCompanySession as saveStoredCompanySession, saveDriverSession as saveStoredDriverSession, setAdminSession } from '../lib/storage'
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
export const saveAuthenticatedCompanySession = ({ user, profile, company, role, session }) => saveStoredCompanySession({ companyId: company?.id, companyName: company?.name, user, profile, role, accessToken: session?.accessToken, refreshToken: session?.refreshToken, expiresAt: session?.expiresAt })
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
