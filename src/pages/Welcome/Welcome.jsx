import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import styles from './Welcome.module.css'

function Welcome() {
  const { t } = useLanguage()
  return <div className={styles.page}><Header /><main className={styles.main}><section className={styles.intro}><h1>{t('publicWelcomeTitle')}</h1><p>{t('publicWelcomeCopy')}</p></section><section className={styles.options}><article className={styles.option}><div className={styles.icon} aria-hidden="true">▱</div><p className={styles.kicker}>{t('myVehicle')}</p><h2>{t('privateOwners')}</h2><p>{t('privateDescription')}</p><Link to="/home?mode=private">{t('continue')}</Link></article><article className={styles.option}><div className={styles.icon} aria-hidden="true">▰▰</div><p className={styles.kicker}>{t('companyFleet')}</p><h2>{t('businessFleets')}</h2><p>{t('companyDescription')}</p><Link to="/company">{t('continue')}</Link></article></section><Link className={styles.adminLink} to="/admin">{t('companyAdminLogin')}</Link></main></div>
}

export default Welcome
