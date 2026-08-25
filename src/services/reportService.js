import { createReportDate as createStoredReportDate, getActiveVehicleIssues as getStoredActiveVehicleIssues, getReports as getStoredReports, getVehicleReports as getStoredVehicleReports, saveReport, updateReportStatus as updateStoredReportStatus } from '../lib/storage'

export const getReports = () => getStoredReports()
export const getVehicleReports = (vehicleId) => getStoredVehicleReports(vehicleId)
export const getActiveVehicleIssues = (vehicleId) => getStoredActiveVehicleIssues(vehicleId)
export const createReport = (report) => {
  const createdAt = report.createdAt || report.timestamp || new Date().toISOString()
  const date = new Date(createdAt)
  return saveReport({ id: report.id || crypto.randomUUID(), ...report, createdAt, timestamp: report.timestamp || createdAt, date: report.date || date.toLocaleDateString(), time: report.time || date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
}
export const updateReportStatus = (reportId, status) => updateStoredReportStatus(reportId, status)
export const createReportDate = () => createStoredReportDate()
