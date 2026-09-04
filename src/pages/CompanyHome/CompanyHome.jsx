import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyVehicles } from '../../services/companyApiService'
import { getCompanySession, isCompanyAdmin } from '../../services/sessionService'
import styles from './CompanyHome.module.css'

function CompanyHome() {
  const { t } = useLanguage()
  const company = getCompanySession()
  const [vehicles, setVehicles] = useState([])
  useEffect(() => { if (isCompanyAdmin()) getCompanyVehicles().then(setVehicles).catch(() => setVehicles([])) }, [])
  if (!isCompanyAdmin()) return <Navigate to="/company/driver" replace />
  return <div className={styles.page}><Header allowCompanySignOut role="companyFleet" /><main className={styles.main}><section className={styles.card}><p>{company?.companyName || company?.name || t('companyFleet')}</p><h1>{t('fleetCheck')}</h1>{vehicles.length === 0 && <section className={styles.empty}><strong>{t('noVehiclesAdded')}</strong><span>{t('addFirstVehicleWhenReady')}</span><Link to="/company/setup">{t('addVehicle')}</Link></section>}<div className={styles.actions}><Link to="/company/vehicles">{t('vehicles')}</Link><Link to="/company/setup">{t('addVehicle')}</Link><Link to="/company/check">{t('vehicleCheck')}</Link><Link to="/company/reports">{t('reports')}</Link><Link to="/company/employees">{t('employees')}</Link><Link to="/admin/dashboard">{t('adminDashboard')}</Link></div></section></main></div>
}
export default CompanyHome
