import { apiRequest } from './apiClient'

export const validateQrAccessToken = (token) => apiRequest(`/qr/public/${token}`)
export const resolveQrAccessToken = (token) => apiRequest(`/qr/resolve/${token}`)
export const generateCompanyQrAccess = (vehicleId) => apiRequest(`/qr/company/vehicles/${vehicleId}/token`, { method: 'POST' })
export const revokeCompanyQrAccess = (vehicleId) => apiRequest(`/qr/company/vehicles/${vehicleId}/token`, { method: 'DELETE' })
