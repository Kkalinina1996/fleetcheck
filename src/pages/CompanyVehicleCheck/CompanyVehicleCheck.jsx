import { Link, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { getVehicleReports } from '../../services/reportService'
import { getDriverSession } from '../../services/sessionService'
import { getVehicleById } from '../../services/vehicleService'
import styles from './CompanyVehicleCheck.module.css'

function CompanyVehicleCheck() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const vehicle = getVehicleById(vehicleId)
  const session = getDriverSession()
  const issues = vehicle ? getVehicleReports(vehicle.id).filter((report) => report.type === 'ISSUE' && report.status === 'OPEN') : []
  if (!vehicle || vehicle.ownerType !== 'company') return <VehicleNotFound />
  return <div className={styles.page}><Header /><main className={styles.main}><Link className={styles.back} to="/company/check">{t('back')}</Link><section className={styles.vehicleInfo}><h1>{vehicle.brand} {vehicle.model}</h1><p>{vehicle.plateNumber}</p><small>{t('employee')}: {session?.employeeName || ''}</small></section><section className={styles.card}><h2>{t('knownIssues')}</h2>{issues.length === 0 ? <p className={styles.empty}>{t('noKnownIssues')}</p> : <div className={styles.list}>{issues.map((issue) => <article className={styles.issue} key={issue.id || issue.createdAt}><strong>{t(issue.issueType)}</strong>{issue.description && <p>{issue.description}</p>}{issue.photo && <img src={issue.photo} alt={t(issue.issueType)} />}</article>)}</div>}<button className={styles.continue} type="button" disabled>{t('continueCheck')}</button></section></main></div>
}

export default CompanyVehicleCheck
