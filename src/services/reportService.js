import { createReportDate as createStoredReportDate, getActiveVehicleIssues as getStoredActiveVehicleIssues, getReports as getStoredReports, getVehicleReports as getStoredVehicleReports, saveReport, updateReportStatus as updateStoredReportStatus } from '../lib/storage'

export const getReports = () => getStoredReports()
export const getVehicleReports = (vehicleId) => getStoredVehicleReports(vehicleId)
export const getActiveVehicleIssues = (vehicleId) => getStoredActiveVehicleIssues(vehicleId)
export const createReport = (report) => saveReport({ ...report, createdAt: report.createdAt || report.timestamp || new Date().toISOString() })
export const updateReportStatus = (reportId, status) => updateStoredReportStatus(reportId, status)
export const createReportDate = () => createStoredReportDate()
