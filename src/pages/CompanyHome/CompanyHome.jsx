import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanySession } from '../../services/sessionService'
import styles from './CompanyHome.module.css'

function CompanyHome() {
  const { t } = useLanguage()
  const company = getCompanySession()
  return <div className={styles.page}><Header role="companyFleet" /><main className={styles.main}><section className={styles.card}><p>{company?.companyName || company?.name || t('companyFleet')}</p><h1>{t('fleetCheck')}</h1><div className={styles.actions}><button type="button" disabled>{t('vehicles')}</button><button type="button" disabled>{t('reports')}</button><button type="button" disabled>{t('admin')}</button></div></section></main></div>
}

export default CompanyHome
