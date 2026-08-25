import { apiRequest } from './apiClient'

const issueTypeMap = {
  tire: 'TIRE', fuel: 'FUEL', adBlue: 'ADBLUE', oilService: 'OIL_SERVICE', lights: 'LIGHTS',
  damage: 'DAMAGE', warningLight: 'WARNING_LIGHT', accident: 'ACCIDENT', other: 'OTHER',
}

const toVehicle = (vehicle) => ({ ...vehicle, companyId: vehicle.company_id, plateNumber: vehicle.plate_number, vehicleType: vehicle.vehicle_type, ownerType: vehicle.owner_type?.toLowerCase(), createdAt: vehicle.created_at, updatedAt: vehicle.updated_at })
const toReport = (report) => {
  const createdAt = report.created_at
  const date = new Date(createdAt)
  return { ...report, vehicleId: report.vehicle_id, companyId: report.company_id, employeeName: report.employee_name, issueType: report.issue_type?.toLowerCase(), mediaType: report.media_type, mediaPath: report.media_path, createdAt, date: date.toLocaleDateString(), time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}

export async function getCompanyVehicles() {
  const { vehicles } = await apiRequest('/vehicles')
  return vehicles.map(toVehicle)
}

export async function getCompanyVehicle(vehicleId) {
  const { vehicle } = await apiRequest(`/vehicles/${vehicleId}`)
  return toVehicle(vehicle)
}

export async function createCompanyVehicle(vehicle) {
  const { vehicle: created } = await apiRequest('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) })
  return toVehicle(created)
}

export async function updateCompanyVehicle(vehicleId, vehicle) {
  const { vehicle: updated } = await apiRequest(`/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(vehicle) })
  return toVehicle(updated)
}

export async function deleteCompanyVehicle(vehicleId) {
  await apiRequest(`/vehicles/${vehicleId}`, { method: 'DELETE' })
}

export async function getVehicleHistory(vehicleId) {
  const { vehicle, reports } = await apiRequest(`/vehicles/${vehicleId}/history`)
  return { vehicle: toVehicle(vehicle), reports: reports.map(toReport) }
}

export async function getVehicleIssues(vehicleId) {
  const { issues } = await apiRequest(`/vehicles/${vehicleId}/issues`)
  return issues.map(toReport)
}

export async function getCompanyReports() {
  const { reports } = await apiRequest('/reports')
  return reports.map(toReport)
}

export async function createCompanyReport(report, file = null) {
  let media = null
  if (file) media = await uploadReportMedia(report.vehicleId, file)
  const payload = {
    ...(media ? { id: media.reportId, mediaType: media.mediaType, mediaPath: media.mediaPath } : {}),
    vehicleId: report.vehicleId,
    employeeName: report.employeeName || '',
    type: report.type,
    issueType: issueTypeMap[report.issueType] || report.issueType,
    description: report.description || '',
  }
  const { report: created } = await apiRequest('/reports', { method: 'POST', body: JSON.stringify(payload) })
  return toReport(created)
}

export async function updateCompanyReportStatus(reportId, status) {
  const { report } = await apiRequest(`/reports/${reportId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  return toReport(report)
}

export const getCompanyReportMediaUrl = (reportId) => apiRequest(`/reports/${reportId}/media`)

export async function uploadReportMedia(vehicleId, file) {
  const reportId = crypto.randomUUID()
  return apiRequest('/reports/upload', { method: 'POST', body: file, headers: { 'Content-Type': file.type, 'X-Vehicle-Id': vehicleId, 'X-Report-Id': reportId } })
}

export async function getCompanyNotifications() {
  const { notifications } = await apiRequest('/notifications')
  return notifications
}

export const markCompanyNotificationRead = async (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
export const markAllCompanyNotificationsRead = async () => apiRequest('/notifications/read-all', { method: 'PATCH' })
export const getCompanyDashboard = () => apiRequest('/dashboard')
