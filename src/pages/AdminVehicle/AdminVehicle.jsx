import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { clearAdminSession, getVehicleById, getVehicleReports, hasAdminSession, updateReportStatus } from '../../lib/storage'
import { getCompanySession, isCompanyLoggedIn } from '../../services/sessionService'
import styles from './AdminVehicle.module.css'

const statusKey = (status) => status === 'IN_REPAIR' || status === 'IN REPAIR' ? 'inRepair' : status.toLowerCase()

function AdminVehicle() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const company = getCompanySession()
  const companyId = company?.companyId || company?.id
  const companyAccess = isCompanyLoggedIn()
  if (!hasAdminSession() && !companyAccess) return <Navigate to="/admin" replace />
  const vehicle = getVehicleById(vehicleId)
  if (!vehicle || (companyAccess && vehicle.companyId !== companyId)) return <VehicleNotFound />
  const reports = getVehicleReports(vehicle.id).filter((report) => !companyAccess || report.companyId === companyId)
  const logout = () => { clearAdminSession(); navigate('/admin') }
  const updateStatus = (reportId, status) => { updateReportStatus(reportId, status); navigate(0) }
  return <div className={styles.page}><Header admin onAction={logout} actionLabel="logout" /><main className={styles.main}><Link className={styles.back} to="/admin/dashboard">← {t('backToDashboard')}</Link><div className={styles.title}><p>{t('vehicleHistory')}</p><h1>{vehicle.plateNumber}</h1></div>{reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <div className={styles.list}>{reports.map((report) => { const isIssue = report.type === 'ISSUE'; return <article className={styles.card} key={report.id || report.timestamp}><div className={styles.cardHead}><strong>{isIssue ? t(report.issueType) : t('vehicleOk')}</strong>{isIssue ? <select className={`${styles.statusSelect} ${styles[statusKey(report.status)]}`} value={report.status === 'IN REPAIR' ? 'IN_REPAIR' : report.status} onChange={(event) => updateStatus(report.id, event.target.value)}><option value="OPEN">{t('open')}</option><option value="IN_REPAIR">{t('inRepair')}</option><option value="RESOLVED">{t('resolved')}</option></select> : <span className={`${styles.badge} ${styles.ok}`}>OK</span>}</div><p>{report.description || '—'}</p>{report.photo && <img src={report.photo} alt={t('photo')} />}<div className={styles.meta}><span>{t('driver')}: {report.driverName}</span><span>{t('tlNumber')}: {report.tlNumber}</span><span>{report.date} {report.time}</span></div></article> })}</div>}</main></div>
}

export default AdminVehicle
