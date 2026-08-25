import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { clearCheckIn, getActiveIssues, getVehicleById, hasDriverSession } from '../../lib/storage'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import styles from './KnownIssues.module.css'

function KnownIssues() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const vehicle = getVehicleById(vehicleId)
  const isCheckedIn = vehicle && hasDriverSession(vehicle.id)
  const reports = vehicle ? getActiveIssues(vehicle.id) : []

  useEffect(() => {
    if (vehicle && !reports.length) navigate(`/vehicle/${vehicleId}/check`, { replace: true })
  }, [navigate, reports.length, vehicle, vehicleId])

  if (!vehicle) return <VehicleNotFound />
  if (!reports.length) return null

  const endShift = () => { clearCheckIn(); navigate('/home') }
  return <div className={styles.page}><Header onAction={isCheckedIn ? endShift : undefined} actionLabel="endShift" /><main className={styles.main}><Link className={styles.back} to={`/vehicle/${vehicleId}`}>← {t('back')}</Link><p className={styles.vehicle}>{vehicle.plateNumber}</p><h1>{t('knownIssue')}</h1><p className={styles.intro}>{t('knownIssueHint')}</p><div className={styles.list}>{reports.map((report) => <article className={styles.card} key={report.id || report.timestamp}><div className={styles.cardTop}><strong>{t(report.issueType)}</strong><b>{report.status === 'IN_REPAIR' || report.status === 'IN REPAIR' ? t('inRepair') : t('open')}</b></div>{report.description && <p>{report.description}</p>}{report.photo && <img src={report.photo} alt={t('photo')} />}<small>{t('reported')}: {report.date}, {report.time}</small><small>{t('driver')}: {report.driverName}</small><small>{t('tlNumber')}: {report.tlNumber}</small></article>)}</div><button className={styles.acknowledge} type="button" onClick={() => navigate(`/vehicle/${vehicleId}/check`)}>{t('seenIssue')}</button></main></div>
}

export default KnownIssues
