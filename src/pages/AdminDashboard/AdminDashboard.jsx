import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { clearAdminSession, getActiveVehicleIssues, getReports, getVehicleReports, getVehicles, hasAdminSession, updateReportStatus } from '../../lib/storage'
import { getCompanySession, isCompanyLoggedIn } from '../../services/sessionService'
import styles from './AdminDashboard.module.css'

const statusKey = (status) => status === 'IN_REPAIR' || status === 'IN REPAIR' ? 'inRepair' : status.toLowerCase()

function AdminDashboard() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [depotFilter, setDepotFilter] = useState('ALL')
  const company = getCompanySession()
  const companyId = company?.companyId || company?.id
  const companyAccess = isCompanyLoggedIn()
  if (!hasAdminSession() && !companyAccess) return <Navigate to="/admin" replace />
  const vehicles = getVehicles().filter((vehicle) => !companyAccess || vehicle.companyId === companyId)
  const reports = getReports().filter((report) => (!companyAccess || report.companyId === companyId) && (depotFilter === 'ALL' || report.depot === depotFilter))
  const openIssues = reports.filter((report) => report.status === 'OPEN')
  const repairIssues = reports.filter((report) => ['IN_REPAIR', 'IN REPAIR'].includes(report.status))
  const okVehicles = vehicles.filter((vehicle) => !getActiveVehicleIssues(vehicle.id).length).length
  const cards = [{ label: t('totalVehicles'), value: vehicles.length, kind: 'total' }, { label: t('vehiclesOk'), value: okVehicles, kind: 'ok' }, { label: t('needAttention'), value: repairIssues.length, kind: 'repair' }, { label: t('urgent'), value: openIssues.length, kind: 'open' }]
  const updateStatus = (reportId, status) => { updateReportStatus(reportId, status); navigate(0) }
  const logout = () => { clearAdminSession(); navigate('/admin') }
  return <div className={styles.page}><aside className={styles.sidebar}><div className={styles.sideBrand}><span>F</span>FleetCheck</div><div className={styles.sideItem}>▦ {t('dashboard')}</div></aside><div className={styles.content}><Header admin onAction={logout} actionLabel="logout" /><main className={styles.main}><div className={styles.title}><p>FLEET MANAGEMENT</p><h1>{t('dashboard')}</h1><div className={styles.filters}>{['ALL', 'GLS', 'DPD'].map((option) => <button className={depotFilter === option ? styles.activeFilter : ''} type="button" key={option} onClick={() => setDepotFilter(option)}>{option === 'ALL' ? t('all') : option}</button>)}</div></div><section className={styles.stats}>{cards.map((card) => <article className={`${styles.stat} ${styles[card.kind]}`} key={card.kind}><p>{card.label}</p><strong>{card.value}</strong></article>)}</section><section className={styles.panel}><h2>{t('fleetVehicles')}</h2><div className={styles.vehicleGrid}>{vehicles.map((vehicle) => { const activity = getVehicleReports(vehicle.id).find((report) => depotFilter === 'ALL' || report.depot === depotFilter); const active = getActiveVehicleIssues(vehicle.id).filter((report) => depotFilter === 'ALL' || report.depot === depotFilter); const status = active.some((report) => report.status === 'OPEN') ? 'OPEN' : active.length ? 'IN_REPAIR' : 'OK'; return <Link className={styles.vehicleCard} key={vehicle.id} to={`/admin/vehicle/${vehicle.id}`}><b>{vehicle.plateNumber}</b>{vehicle.createdAt && <span className={styles.newBadge}>{t('addedManually')}</span>}<span className={`${styles.badge} ${styles[statusKey(status)]}`}>{status === 'OK' ? 'OK' : t(statusKey(status))}</span><small>{t('lastActivity')}: {activity ? `${activity.date} ${activity.time}` : t('noReports')}</small>{vehicle.createdAt && <small>{t('addedOn')}: {new Date(vehicle.createdAt).toLocaleDateString()}</small>}{vehicle.createdAt && <small>{t('addedBy')}: {vehicle.addedBy.driverName} · {t('tlNumber')}: {vehicle.addedBy.tlNumber}</small>}</Link> })}</div></section><section className={styles.panel}><div className={styles.panelHead}><h2>{t('recentReports')}</h2><span>{reports.length}</span></div>{reports.length === 0 ? <p className={styles.empty}>{t('noReports')}</p> : <div className={styles.tableWrap}><table><thead><tr><th>{t('vehicle')}</th><th>{t('depot')}</th><th>{t('driver')}</th><th>{t('tlNumber')}</th><th>{t('issue')}</th><th>{t('description')}</th><th>{t('status')}</th><th>{t('date')}</th></tr></thead><tbody>{reports.slice(0, 12).map((report) => { const vehicle = vehicles.find((item) => item.id === report.vehicleId); const isIssue = report.type === 'ISSUE'; return <tr key={report.id || `${report.timestamp}-${report.vehicleId}`}><td><Link to={`/admin/vehicle/${report.vehicleId}`}>{vehicle?.plateNumber || t('vehicleNotFound')}</Link></td><td>{report.depot || '—'}</td><td>{report.driverName}</td><td>{report.tlNumber}</td><td>{isIssue ? t(report.issueType) : t('vehicleOk')}</td><td>{report.description || '—'}</td><td>{isIssue ? <select className={`${styles.statusSelect} ${styles[statusKey(report.status)]}`} value={report.status === 'IN REPAIR' ? 'IN_REPAIR' : report.status} onChange={(event) => updateStatus(report.id, event.target.value)}><option value="OPEN">{t('open')}</option><option value="IN_REPAIR">{t('inRepair')}</option><option value="RESOLVED">{t('resolved')}</option></select> : <span className={`${styles.badge} ${styles.ok}`}>OK</span>}</td><td>{report.date}<small>{report.time}</small></td></tr> })}</tbody></table></div>}</section></main></div></div>
}

export default AdminDashboard
