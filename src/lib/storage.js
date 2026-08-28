import { normalizePlateNumber, seedVehicles } from '../data/vehicles'

const REPORTS_KEY = 'fleetcheck_reports'
const VEHICLES_KEY = 'fleetcheck_vehicles'
const DRIVER_SESSION_KEY = 'fleetcheck_checkin'
const ADMIN_SESSION_KEY = 'fleetcheck_admin'
const COMPANY_SESSION_KEY = 'fleetcheck_company'
const PRIVATE_SESSION_KEY = 'fleetcheck_private'
const COMPANY_PROFILE_KEY = 'fleetcheck_company_profile'
const NOTIFICATIONS_KEY = 'fleetcheck_notifications'

export const getReports = () => JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]')
export const saveReport = (report) => {
  localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...getReports()]))
  return report
}
export const updateReportStatus = (reportId, status) => {
  const reports = getReports().map((report) => report.id === reportId ? { ...report, status } : report)
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
  return reports
}
export const getNotifications = () => JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]')
export const saveNotification = (notification) => localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([notification, ...getNotifications()]))
export const markAllNotificationsRead = () => localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(getNotifications().map((notification) => ({ ...notification, read: true }))))
export const markNotificationRead = (notificationId) => localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(getNotifications().map((notification) => notification.id === notificationId ? { ...notification, read: true } : notification)))

const getAddedVehicles = () => JSON.parse(localStorage.getItem(VEHICLES_KEY) || '[]')
export const getVehicles = () => [...seedVehicles, ...getAddedVehicles()]
export const getVehicleById = (vehicleId) => getVehicles().find((vehicle) => vehicle.id === vehicleId.toLowerCase())
export const getVehicleByPlateNumber = (plateNumber) => getVehicles().find((vehicle) => vehicle.plateNumber === normalizePlateNumber(plateNumber))
export const addVehicle = ({ plateNumber, driverName, tlNumber, brand, model, year, ownerType, companyId, vehicleType }) => {
  const normalizedPlate = normalizePlateNumber(plateNumber)
  const existingVehicle = companyId
    ? getVehicles().find((vehicle) => vehicle.companyId === companyId && vehicle.plateNumber === normalizedPlate)
    : getVehicleByPlateNumber(normalizedPlate)
  if (existingVehicle) return existingVehicle
  const vehicle = { id: crypto.randomUUID(), companyId: companyId || '', plateNumber: normalizedPlate, brand: brand || '', model: model || '', year: year || '', vehicleType: vehicleType || '', ownerType: ownerType || '', createdAt: new Date().toISOString(), addedBy: { driverName, tlNumber } }
  localStorage.setItem(VEHICLES_KEY, JSON.stringify([...getAddedVehicles(), vehicle]))
  return vehicle
}
export const updateVehicle = (vehicleId, updates) => {
  const vehicles = getAddedVehicles().map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle)
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles))
  return getVehicleById(vehicleId)
}

export const getVehicleReports = (vehicleId) => getReports().filter((report) => String(report.vehicleId).toLowerCase() === vehicleId.toLowerCase())
export const getActiveVehicleIssues = (vehicleId) => getVehicleReports(vehicleId).filter((report) => ['OPEN', 'IN_REPAIR', 'IN REPAIR'].includes(report.status))

export const saveDriverSession = (session) => localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(session))
export const getDriverSession = () => JSON.parse(localStorage.getItem(DRIVER_SESSION_KEY) || 'null')
export const clearDriverSession = () => localStorage.removeItem(DRIVER_SESSION_KEY)
export const hasDriverSession = (vehicleId) => { const session = getDriverSession(); return Boolean(session?.driverName && session.vehicleId === vehicleId) }
export const setAdminSession = () => localStorage.setItem(ADMIN_SESSION_KEY, 'true')
export const clearAdminSession = () => localStorage.removeItem(ADMIN_SESSION_KEY)
export const hasAdminSession = () => localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
export const getCompanySession = () => JSON.parse(localStorage.getItem(COMPANY_SESSION_KEY) || 'null')
export const saveCompanySession = (session) => { localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(session)); localStorage.setItem(COMPANY_SESSION_KEY, JSON.stringify(session)) }
export const clearCompanySession = () => localStorage.removeItem(COMPANY_SESSION_KEY)
export const getPrivateSession = () => JSON.parse(localStorage.getItem(PRIVATE_SESSION_KEY) || 'null')
export const savePrivateSession = (session) => localStorage.setItem(PRIVATE_SESSION_KEY, JSON.stringify(session))
export const clearPrivateSession = () => localStorage.removeItem(PRIVATE_SESSION_KEY)
export const createReportDate = () => { const now = new Date(); return { date: now.toLocaleDateString(), time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp: now.toISOString() } }

export const saveCheckIn = saveDriverSession
export const getCheckIn = getDriverSession
export const clearCheckIn = clearDriverSession
export const getActiveIssues = getActiveVehicleIssues
