import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import styles from './CompanyRegister.module.css'

function CompanyRegister() {
  const { t } = useLanguage()
  return <div className={styles.page}><Header /><main className={styles.main}><section className={styles.card}><h1>{t('createCompanyAccount')}</h1><p>{t('companyRegistrationNext')}</p><Link to="/company">{t('back')}</Link></section></main></div>
}

export default CompanyRegister
