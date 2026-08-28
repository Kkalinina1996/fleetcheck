import { apiRequest } from './apiClient'
const base = (mode) => `/reminders/${mode}`
export const getReminders = (mode, vehicleId) => apiRequest(`${base(mode)}${vehicleId ? `?vehicleId=${vehicleId}` : ''}`).then(({ reminders }) => reminders)
export const createReminder = (mode, body) => apiRequest(base(mode), { method: 'POST', body: JSON.stringify(body) }).then(({ reminder }) => reminder)
export const completeReminder = (mode, id) => apiRequest(`${base(mode)}/${id}/complete`, { method: 'PATCH' }).then(({ reminder }) => reminder)
export const deleteReminder = (mode, id) => apiRequest(`${base(mode)}/${id}`, { method: 'DELETE' })
