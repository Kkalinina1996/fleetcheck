import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanySession } from '../../services/sessionService'
import { getCompanyVehicles } from '../../services/vehicleService'
import styles from './CompanyHome.module.css'

function CompanyHome() {
  const { t } = useLanguage()
  const company = getCompanySession()
  const companyId = company?.companyId || company?.id
  const hasVehicles = getCompanyVehicles(companyId).length > 0
  return <div className={styles.page}><Header allowCompanySignOut role="companyFleet" /><main className={styles.main}><section className={styles.card}><p>{company?.companyName || company?.name || t('companyFleet')}</p><h1>{t('fleetCheck')}</h1>{!hasVehicles && <section className={styles.empty}><strong>{t('noVehiclesAdded')}</strong><span>{t('addFirstVehicleWhenReady')}</span><Link to="/company/setup">{t('addVehicle')}</Link></section>}<div className={styles.actions}><Link to="/company/vehicles">{t('vehicles')}</Link><Link to="/company/setup">{t('addVehicle')}</Link><Link to="/company/check">{t('vehicleCheck')}</Link><Link to="/company/reports">{t('reports')}</Link><Link to="/admin/dashboard">{t('adminDashboard')}</Link></div></section></main></div>
}
export default CompanyHome
