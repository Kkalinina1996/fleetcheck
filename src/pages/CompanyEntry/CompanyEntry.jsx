import { Navigate, Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { isCompanyLoggedIn } from '../../services/sessionService'
import styles from './CompanyEntry.module.css'

function CompanyEntry() {
  const { t } = useLanguage()
  if (isCompanyLoggedIn()) return <Navigate to="/company/home" replace />
  return <div className={styles.page}><Header /><main className={styles.main}><section className={styles.card}><h1>{t('companyFleet')}</h1><p>{t('companyEntryHint')}</p><div className={styles.actions}><Link className={styles.primary} to="/company/check"><strong>{t('vehicleCheck')}</strong><span>{t('driversEmployees')}</span></Link><Link to="/admin"><strong>{t('companyLogin')}</strong><span>{t('existingCompanyAccounts')}</span></Link><Link to="/company/register"><strong>{t('createCompanyAccount')}</strong><span>{t('newCompanies')}</span></Link></div></section></main></div>
}

export default CompanyEntry
