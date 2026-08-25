import { clearAdminSession, clearCompanySession as clearStoredCompanySession, clearDriverSession as clearStoredDriverSession, getCompanySession as getStoredCompanySession, getDriverSession as getStoredDriverSession, hasAdminSession, hasDriverSession as hasStoredDriverSession, saveCompanySession as saveStoredCompanySession, saveDriverSession as saveStoredDriverSession, setAdminSession } from '../lib/storage'

export const getDriverSession = () => getStoredDriverSession()
export const saveDriverSession = (session) => saveStoredDriverSession(session)
export const clearDriverSession = () => clearStoredDriverSession()
export const hasDriverSession = (vehicleId) => hasStoredDriverSession(vehicleId)
export const isAdminLoggedIn = () => hasAdminSession()
export const loginAdmin = () => setAdminSession()
export const logoutAdmin = () => clearAdminSession()
export const getCompanySession = () => getStoredCompanySession()
export const saveCompanySession = (session) => saveStoredCompanySession(session)
export const clearCompanySession = () => clearStoredCompanySession()
export const isCompanyLoggedIn = () => Boolean(getStoredCompanySession()?.companyId || getStoredCompanySession()?.id)
