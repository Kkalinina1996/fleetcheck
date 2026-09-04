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
export const getCompanyMemberships = () => getStoredCompanySession()?.memberships || []
export const getActiveCompanyId = () => getStoredCompanySession()?.activeCompanyId || getStoredCompanySession()?.companyId || null
export const hasCompanyAuthentication = () => Boolean(getStoredCompanySession()?.user?.id && getStoredCompanySession()?.accessToken)
export const isCompanyLoggedIn = () => Boolean(hasCompanyAuthentication() && getActiveCompanyId())
export const isCompanyAdmin = () => isCompanyLoggedIn() && getStoredCompanySession()?.role === 'COMPANY_ADMIN'
export const isCompanyEmployee = () => isCompanyLoggedIn() && getStoredCompanySession()?.role === 'EMPLOYEE'
export const saveAuthenticatedCompanySession = ({ user, profile, company, role, memberships, session }) => {
  clearStoredPrivateSession()
  const availableMemberships = memberships || (company ? [{ companyId: company.id, company, role }] : [])
  const activeCompanyId = company?.id || (availableMemberships.length === 1 ? availableMemberships[0].companyId : null)
  const activeMembership = availableMemberships.find((membership) => membership.companyId === activeCompanyId)
  saveStoredCompanySession({
    companyId: activeCompanyId,
    activeCompanyId,
    companyName: activeMembership?.company?.name || company?.name || null,
    user,
    profile,
    role: activeMembership?.role || role || null,
    memberships: availableMemberships,
    accessToken: session?.accessToken,
    refreshToken: session?.refreshToken,
    expiresAt: session?.expiresAt,
  })
}
export const selectActiveCompany = (companyId) => {
  const session = getStoredCompanySession()
  const membership = session?.memberships?.find((item) => item.companyId === companyId)
  if (!session || !membership) return false
  saveStoredCompanySession({ ...session, companyId, activeCompanyId: companyId, companyName: membership.company?.name || null, role: membership.role })
  return true
}
export const clearCompanySession = () => { clearAdminSession(); clearStoredCompanySession() }
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
    if (data.memberships?.length) throw new Error('Company session')
    saveAuthenticatedPrivateSession({ ...data, session })
    return data
  } catch {
    clearPrivateSession()
    return null
  }
}
