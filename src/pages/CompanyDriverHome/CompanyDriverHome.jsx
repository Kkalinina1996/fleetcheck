import { Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { isCompanyEmployee } from '../../services/sessionService'
import styles from './CompanyDriverHome.module.css'

function CompanyDriverHome() {
  const { t } = useLanguage()
  if (!isCompanyEmployee()) return <Navigate to="/company/driver/login" replace />
  return <div className={styles.page}><Header allowCompanySignOut role="employeeRole" /><main className={styles.main}><section className={styles.card}><p>{t('employeeRole')}</p><h1>{t('vehicleCheck')}</h1><span>{t('driverHomeHint')}</span></section></main></div>
}

export default CompanyDriverHome
