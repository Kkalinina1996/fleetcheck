import { apiRequest } from './apiClient'

export const getCompanyEmployees = async () => (await apiRequest('/company/employees')).employees
export const inviteCompanyEmployee = async (employee) => (await apiRequest('/company/employees', { method: 'POST', body: JSON.stringify(employee) })).employee
export const removeCompanyEmployee = (userId) => apiRequest(`/company/employees/${userId}`, { method: 'DELETE' })
