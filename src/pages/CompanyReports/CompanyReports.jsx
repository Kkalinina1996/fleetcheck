import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyReports } from '../../services/companyApiService'
import { isCompanyAdmin } from '../../services/sessionService'
import styles from './CompanyReports.module.css'

function CompanyReports() {
  const { t } = useLanguage()
  const [reports, setReports] = useState([])
  useEffect(() => { if (isCompanyAdmin()) getCompanyReports().then(setReports).catch(() => setReports([])) }, [])
  if (!isCompanyAdmin()) return <Navigate to="/company/driver" replace />
  return <div className={styles.page}><Header allowCompanySignOut role="companyFleet" /><main className={styles.main}><Link to="/company/home">{t('backToCompanyHome')}</Link><h1>{t('reports')}</h1>{reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <section className={styles.list}>{reports.map((report) => <article className={styles.card} key={report.id}><div><strong>{report.type === 'ISSUE' ? t(report.issueType) : t('vehicleOk')}</strong><span>{report.status}</span></div>{report.description && <small>{report.description}</small>}{report.mediaPath && <small>{report.mediaType === 'video' ? t('addVideo') : t('photo')}</small>}<small>{report.date} {report.time}</small></article>)}</section>}</main></div>
}
export default CompanyReports
