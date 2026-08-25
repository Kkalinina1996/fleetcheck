import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getReports } from '../../services/reportService'
import { getCompanySession } from '../../services/sessionService'
import styles from './CompanyReports.module.css'

function CompanyReports() {
  const { t } = useLanguage()
  const company = getCompanySession()
  const companyId = company?.companyId || company?.id
  const reports = getReports().filter((report) => report.companyId === companyId)
  return <div className={styles.page}><Header allowCompanySignOut role="companyFleet" /><main className={styles.main}><Link to="/company/home">{t('backToCompanyHome')}</Link><h1>{t('reports')}</h1>{reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <section className={styles.list}>{reports.map((report) => <article className={styles.card} key={report.id}><div><strong>{report.type === 'ISSUE' ? t(report.issueType) : t('vehicleOk')}</strong><span>{report.status}</span></div><p>{report.plateNumber}</p>{report.description && <small>{report.description}</small>}{report.photo && <img src={report.photo} alt={t('photo')} />}{report.video && <video controls src={report.video} />}<small>{report.date} {report.time}</small></article>)}</section>}</main></div>
}
export default CompanyReports
