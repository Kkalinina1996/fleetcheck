import { apiRequest } from './apiClient'

const issueTypeMap = {
  tire: 'TIRE', fuel: 'FUEL', adBlue: 'ADBLUE', oilService: 'OIL_SERVICE', lights: 'LIGHTS',
  damage: 'DAMAGE', warningLight: 'WARNING_LIGHT', accident: 'ACCIDENT', other: 'OTHER', tiresWheels: 'TIRES_WHEELS',
  engine: 'ENGINE', brakes: 'BRAKES', bodyDamage: 'BODY_DAMAGE', interior: 'INTERIOR', fluidOil: 'FLUID_OIL',
}

const toVehicle = (vehicle) => ({ ...vehicle, plateNumber: vehicle.plate_number, vehicleType: vehicle.vehicle_type, ownerType: vehicle.owner_type?.toLowerCase(), ownerUserId: vehicle.owner_user_id, createdAt: vehicle.created_at })
const toReport = (report) => {
  const createdAt = report.created_at
  const date = new Date(createdAt)
  return { ...report, vehicleId: report.vehicle_id, issueType: report.issue_type?.toLowerCase(), mediaType: report.media_type, mediaPath: report.media_path, createdAt, date: date.toLocaleDateString(), time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}

export async function getPrivateVehicles() {
  const { vehicles } = await apiRequest('/private/vehicles')
  return vehicles.map(toVehicle)
}

export async function getPrivateVehicle(vehicleId) {
  const { vehicle } = await apiRequest(`/private/vehicles/${vehicleId}`)
  return toVehicle(vehicle)
}

export async function createPrivateVehicle(vehicle) {
  const { vehicle: created } = await apiRequest('/private/vehicles', { method: 'POST', body: JSON.stringify(vehicle) })
  return toVehicle(created)
}

export async function getPrivateVehicleHistory(vehicleId) {
  const { vehicle, reports } = await apiRequest(`/private/vehicles/${vehicleId}/history`)
  return { vehicle: toVehicle(vehicle), reports: reports.map(toReport) }
}

export async function createPrivateReport(report, file = null) {
  let media = null
  if (file) media = await uploadPrivateReportMedia(report.vehicleId, file)
  const payload = {
    ...(media ? { id: media.reportId, mediaType: media.mediaType, mediaPath: media.mediaPath } : {}),
    vehicleId: report.vehicleId,
    type: report.type,
    issueType: issueTypeMap[report.issueType] || report.issueType,
    priority: report.priority?.toUpperCase(),
    description: report.description || '',
  }
  const { report: created } = await apiRequest('/private/reports', { method: 'POST', body: JSON.stringify(payload) })
  return toReport(created)
}

export async function uploadPrivateReportMedia(vehicleId, file) {
  const reportId = crypto.randomUUID()
  return apiRequest('/private/reports/upload', { method: 'POST', body: file, headers: { 'Content-Type': file.type, 'X-Vehicle-Id': vehicleId, 'X-Report-Id': reportId } })
}

export const getPrivateReportMediaUrl = (reportId) => apiRequest(`/private/reports/${reportId}/media`)
