import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { getPrivateReportMediaUrl, getPrivateVehicleHistory } from '../../services/privateApiService'
import styles from './PrivateHistory.module.css'

function PrivateHistory() {
  const { vehicleId } = useParams(); const [searchParams] = useSearchParams(); const { t } = useLanguage(); const [data, setData] = useState(null)
  useEffect(() => { getPrivateVehicleHistory(vehicleId).then(async (history) => { const reports = await Promise.all(history.reports.map(async (report) => report.mediaPath ? { ...report, ...(await getPrivateReportMediaUrl(report.id)) } : report)); setData({ ...history, reports }) }).catch(() => setData(false)) }, [vehicleId])
  if (data === false) return <VehicleNotFound />
  if (!data) return null
  const mediaOnly = searchParams.get('media') === 'true'; const reports = data.reports.filter((report) => !mediaOnly || report.signedUrl)
  return <div className={styles.page}><Header role="privateRole" /><main className={styles.main}><Link to="/home?mode=private">{t('myVehicles')}</Link><h1>{mediaOnly ? t('photosVideos') : t('vehicleHistory')}</h1><p className={styles.plate}>{data.vehicle.plateNumber}</p>{reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <section className={styles.list}>{reports.map((report) => <article className={styles.card} key={report.id}><div><strong>{report.type === 'ISSUE' ? t(report.issueType) : t('vehicleOk')}</strong><span>{report.status}</span></div>{report.priority && <p>{t(report.priority.toLowerCase())}</p>}{report.description && <p>{report.description}</p>}{report.signedUrl && report.mediaType === 'image' && <img src={report.signedUrl} alt={t('photo')} />}{report.signedUrl && report.mediaType === 'video' && <video controls src={report.signedUrl} />}<small>{report.date} {report.time}</small></article>)}</section>}</main></div>
}
export default PrivateHistory
