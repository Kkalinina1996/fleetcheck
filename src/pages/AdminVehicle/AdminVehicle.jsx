import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyReportMediaUrl, getVehicleHistory, updateCompanyReportStatus } from '../../services/companyApiService'
import { isCompanyLoggedIn } from '../../services/sessionService'
import styles from './AdminVehicle.module.css'

const statusKey = (status) => status === 'IN_REPAIR' ? 'inRepair' : status?.toLowerCase()
function AdminVehicle() {
  const { vehicleId } = useParams(); const { t } = useLanguage(); const [data, setData] = useState(null)
  const load = () => getVehicleHistory(vehicleId).then(async (history) => { const reports = await Promise.all(history.reports.map(async (report) => report.mediaPath ? { ...report, ...(await getCompanyReportMediaUrl(report.id).catch(() => ({}))) } : report)); setData({ ...history, reports }) }).catch(() => setData(false))
  useEffect(() => { getVehicleHistory(vehicleId).then(async (history) => { const reports = await Promise.all(history.reports.map(async (report) => report.mediaPath ? { ...report, ...(await getCompanyReportMediaUrl(report.id).catch(() => ({}))) } : report)); setData({ ...history, reports }) }).catch(() => setData(false)) }, [vehicleId])
  if (!isCompanyLoggedIn()) return <Navigate to="/admin" replace />
  if (data === false) return <VehicleNotFound />
  if (!data) return null
  const updateStatus = async (reportId, status) => { await updateCompanyReportStatus(reportId, status); await load() }
  return <div className={styles.page}><Header admin /><main className={styles.main}><Link className={styles.back} to="/admin/dashboard">← {t('backToDashboard')}</Link><div className={styles.title}><p>{t('vehicleHistory')}</p><h1>{data.vehicle.plateNumber}</h1></div><div className={styles.vehicleActions}><Link to={`/company/check/${vehicleId}`}>{t('checkVehicle')}</Link><Link to={`/company/check/${vehicleId}/report`}>{t('reportNewProblem')}</Link></div>{data.reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <div className={styles.list}>{data.reports.map((report) => { const isIssue = report.type === 'ISSUE'; return <article className={styles.card} key={report.id}><div className={styles.cardHead}><strong>{isIssue ? t(report.issueType) : t('vehicleOk')}</strong>{isIssue ? <select className={`${styles.statusSelect} ${styles[statusKey(report.status)]}`} value={report.status} onChange={(event) => updateStatus(report.id, event.target.value)}><option value="OPEN">{t('open')}</option><option value="IN_REPAIR">{t('inRepair')}</option><option value="RESOLVED">{t('resolved')}</option></select> : <span className={`${styles.badge} ${styles.ok}`}>OK</span>}</div><p>{report.priority && <strong>{t(report.priority)}</strong>}{report.description || '—'}</p>{report.signedUrl && report.mediaType === 'image' && <img src={report.signedUrl} alt={t('photo')} />}{report.signedUrl && report.mediaType === 'video' && <video controls src={report.signedUrl} />}<div className={styles.meta}><span>{t('driver')}: {report.employeeName || '—'}</span><span>{report.date} {report.time}</span></div></article> })}</div>}</main></div>
}
export default AdminVehicle
