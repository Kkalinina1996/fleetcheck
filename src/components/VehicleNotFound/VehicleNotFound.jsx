import Header from '../Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import styles from './VehicleNotFound.module.css'

function VehicleNotFound() {
  const { t } = useLanguage()
  return <div className={styles.page}><Header /><main className={styles.main}><section className={styles.card}><div>!</div><h1>{t('vehicleNotFound')}</h1><p>{t('vehicleNotFoundHint')}</p></section></main></div>
}

export default VehicleNotFound
