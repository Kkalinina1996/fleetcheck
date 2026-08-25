import { Link, useParams, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { getVehicleReports } from '../../services/reportService'
import { getVehicleById } from '../../services/vehicleService'
import styles from './PrivateHistory.module.css'

function PrivateHistory() {
  const { vehicleId } = useParams(); const [searchParams] = useSearchParams(); const { t } = useLanguage(); const vehicle = getVehicleById(vehicleId)
  if (!vehicle || vehicle.ownerType !== 'private') return <VehicleNotFound />
  const mediaOnly = searchParams.get('media') === 'true'; const reports = getVehicleReports(vehicle.id).filter((report) => !mediaOnly || report.photo || report.video)
  return <div className={styles.page}><Header role="privateRole" /><main className={styles.main}><Link to="/home?mode=private">{t('myVehicles')}</Link><h1>{mediaOnly ? t('photosVideos') : t('vehicleHistory')}</h1><p className={styles.plate}>{vehicle.plateNumber}</p>{reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <section className={styles.list}>{reports.map((report) => <article className={styles.card} key={report.id}><div><strong>{report.type === 'ISSUE' ? t(report.issueType) : t('vehicleOk')}</strong><span>{report.status}</span></div>{report.description && <p>{report.description}</p>}{report.photo && <img src={report.photo} alt={t('photo')} />}{report.video && <video controls src={report.video} />}<small>{report.date} {report.time}</small></article>)}</section>}</main></div>
}
export default PrivateHistory
