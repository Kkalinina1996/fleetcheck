import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyDashboard, getCompanyVehicles, getVehicleIssues, updateCompanyReportStatus } from '../../services/companyApiService'
import { isCompanyLoggedIn } from '../../services/sessionService'
import styles from './AdminDashboard.module.css'

const statusKey = (status) => status === 'IN_REPAIR' ? 'inRepair' : status?.toLowerCase()
const vehicleCategory = (activeReports) => {
  if (activeReports.some((report) => report.priority === 'urgent')) return 'URGENT'
  if (activeReports.length) return 'ATTENTION'
  return 'OK'
}

function AdminDashboard() {
  const { t } = useLanguage(); const [dashboard, setDashboard] = useState(null); const [vehicles, setVehicles] = useState([]); const [issues, setIssues] = useState({}); const [activeFilter, setActiveFilter] = useState('ALL')
  const load = () => Promise.all([getCompanyDashboard(), getCompanyVehicles()]).then(async ([data, items]) => { setDashboard(data); setVehicles(items); const entries = await Promise.all(items.map(async (item) => [item.id, await getVehicleIssues(item.id).catch(() => [])])); setIssues(Object.fromEntries(entries)) })
  useEffect(() => { load().catch(() => setDashboard({ stats: { totalVehicles: 0, vehiclesOk: 0, needAttention: 0, urgent: 0 }, recentReports: [] })) }, [])
  if (!isCompanyLoggedIn()) return <Navigate to="/admin" replace />
  const stats = dashboard?.stats || { totalVehicles: 0, vehiclesOk: 0, needAttention: 0, urgent: 0 }
  const cards = [{ label: t('totalVehicles'), value: stats.totalVehicles, filter: 'ALL', kind: 'total' }, { label: t('vehiclesOk'), value: stats.vehiclesOk, filter: 'OK', kind: 'ok' }, { label: t('needAttention'), value: stats.needAttention, filter: 'ATTENTION', kind: 'repair' }, { label: t('urgent'), value: stats.urgent, filter: 'URGENT', kind: 'open' }]
  const visibleVehicles = vehicles.filter((vehicle) => activeFilter === 'ALL' || vehicleCategory(issues[vehicle.id] || []) === activeFilter)
  const emptyMessage = activeFilter === 'URGENT' ? t('noUrgentVehicles') : activeFilter === 'ATTENTION' ? t('noVehiclesNeedingAttention') : t('noVehiclesInCategory')
  const updateStatus = async (reportId, status) => { await updateCompanyReportStatus(reportId, status); await load() }
  return <div className={styles.page}><Header admin /><main className={styles.main}><div className={styles.title}><p>FLEET MANAGEMENT</p><h1>{t('dashboard')}</h1><nav className={styles.quickActions} aria-label={t('dashboard')}><Link to="/company/vehicles">{t('vehicles')}</Link><Link to="/company/setup">{t('addVehicle')}</Link><Link to="/company/reports">{t('reports')}</Link><a href="#notifications">{t('notifications')}</a></nav></div><section className={styles.stats}>{cards.map((card) => <button className={`${styles.stat} ${styles[card.kind]} ${activeFilter === card.filter ? styles.activeStat : ''}`} type="button" key={card.kind} onClick={() => setActiveFilter(card.filter)} aria-pressed={activeFilter === card.filter}><p>{card.label}</p><strong>{card.value}</strong></button>)}</section><section className={styles.panel}><h2>{t('fleetVehicles')} ({vehicles.length})</h2>{visibleVehicles.length === 0 ? <p className={styles.empty}>{emptyMessage}</p> : <div className={styles.vehicleGrid}>{visibleVehicles.map((vehicle) => { const active = issues[vehicle.id] || []; const category = vehicleCategory(active); const status = category === 'OK' ? 'OK' : active.some((report) => report.status === 'OPEN') ? 'OPEN' : 'IN_REPAIR'; return <Link className={styles.vehicleCard} key={vehicle.id} to={`/admin/vehicle/${vehicle.id}`}><b>{vehicle.plateNumber}</b><span>{vehicle.brand} {vehicle.model}</span><span className={`${styles.badge} ${styles[statusKey(status)]}`}>{category === 'OK' ? 'OK' : t(category === 'URGENT' ? 'urgent' : 'attentionNeeded')}</span></Link> })}</div>}</section><section className={styles.panel}><div className={styles.panelHead}><h2>{t('recentReports')}</h2><span>{dashboard?.recentReports?.length || 0}</span></div>{dashboard?.recentReports?.length === 0 ? <p className={styles.empty}>{t('noReports')}</p> : <div className={styles.tableWrap}><table><thead><tr><th>{t('vehicle')}</th><th>{t('driver')}</th><th>{t('issue')}</th><th>{t('description')}</th><th>{t('status')}</th><th>{t('date')}</th></tr></thead><tbody>{dashboard?.recentReports?.map((report) => { const vehicle = vehicles.find((item) => item.id === report.vehicle_id); const isIssue = report.type === 'ISSUE'; return <tr key={report.id}><td><Link to={`/admin/vehicle/${report.vehicle_id}`}>{vehicle?.plateNumber || t('vehicleNotFound')}</Link></td><td>{report.employee_name || '—'}</td><td><Link to={`/admin/vehicle/${report.vehicle_id}`}>{isIssue ? t(report.issue_type?.toLowerCase()) : t('vehicleOk')}</Link></td><td>{report.description || '—'}</td><td>{isIssue ? <select className={`${styles.statusSelect} ${styles[statusKey(report.status)]}`} value={report.status} onChange={(event) => updateStatus(report.id, event.target.value)}><option value="OPEN">{t('open')}</option><option value="IN_REPAIR">{t('inRepair')}</option><option value="RESOLVED">{t('resolved')}</option></select> : <span className={`${styles.badge} ${styles.ok}`}>OK</span>}</td><td>{new Date(report.created_at).toLocaleDateString()}</td></tr> })}</tbody></table></div>}</section></main></div>
}
export default AdminDashboard
