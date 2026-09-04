import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyReportMediaUrl, getVehicleHistory, updateCompanyReportStatus } from '../../services/companyApiService'
import { generateCompanyQrAccess, revokeCompanyQrAccess } from '../../services/qrAccessService'
import { isCompanyLoggedIn } from '../../services/sessionService'
import styles from './AdminVehicle.module.css'

const statusKey = (status) => status === 'IN_REPAIR' ? 'inRepair' : status?.toLowerCase()
const loadVehicleHistory = (vehicleId, setData, setQrToken) => getVehicleHistory(vehicleId).then(async (history) => {
  const reports = await Promise.all(history.reports.map(async (report) => report.mediaPath
    ? { ...report, ...(await getCompanyReportMediaUrl(report.id).catch(() => ({}))) }
    : report))
  setData({ ...history, reports })
  setQrToken(history.vehicle.qr_access_enabled ? history.vehicle.qr_access_token || '' : '')
}).catch(() => setData(false))

function AdminVehicle() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [qrToken, setQrToken] = useState('')
  const [qrBusy, setQrBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => loadVehicleHistory(vehicleId, setData, setQrToken)

  useEffect(() => { loadVehicleHistory(vehicleId, setData, setQrToken) }, [vehicleId])

  if (!isCompanyLoggedIn()) return <Navigate to="/admin" replace />
  if (data === false) return <VehicleNotFound />
  if (!data) return null

  const updateStatus = async (reportId, status) => {
    await updateCompanyReportStatus(reportId, status)
    await load()
  }
  const manageQr = async (action) => {
    setQrBusy(true)
    try {
      if (action === 'revoke') {
        await revokeCompanyQrAccess(vehicleId)
        setQrToken('')
      } else {
        const result = await generateCompanyQrAccess(vehicleId)
        setQrToken(result.token)
      }
    } finally {
      setQrBusy(false)
    }
  }
  const qrUrl = qrToken ? `${window.location.origin}/v/${qrToken}` : ''
  const copyQrUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return <div className={styles.page}>
    <Header admin />
    <main className={styles.main}>
      <Link className={styles.back} to="/admin/dashboard">← {t('backToDashboard')}</Link>
      <div className={styles.title}><p>{t('vehicleHistory')}</p><h1>{data.vehicle.plateNumber}</h1></div>
      <div className={styles.vehicleActions}>
        <Link to={`/company/check/${vehicleId}`}>{t('checkVehicle')}</Link>
        <Link to={`/company/check/${vehicleId}/report`}>{t('reportNewProblem')}</Link>
      </div>
      <section className={styles.qrSection}>
        <div>
          <p className={styles.qrKicker}>{t('qrAccess')}</p>
          <h2>{t('qrVehicleAccess')}</h2>
          <p className={styles.qrHint}>{t('qrAccessHint')}</p>
        </div>
        {qrToken ? <div className={styles.qrActive}>
          <QRCodeSVG className={styles.qrCode} value={qrUrl} size={168} level="M" includeMargin />
          <label className={styles.qrLink}>{t('publicLink')}<input value={qrUrl} readOnly /></label>
          <div className={styles.qrActions}>
            <button type="button" onClick={copyQrUrl}>{copied ? t('linkCopied') : t('copyLink')}</button>
            <button type="button" onClick={() => manageQr('reset')} disabled={qrBusy}>{t('regenerateQr')}</button>
            <button type="button" className={styles.revoke} onClick={() => manageQr('revoke')} disabled={qrBusy}>{t('disableQr')}</button>
          </div>
        </div> : <button className={styles.generate} type="button" onClick={() => manageQr('generate')} disabled={qrBusy}>{t('generateQr')}</button>}
      </section>
      {data.reports.length === 0 ? <section className={styles.empty}>{t('noReports')}</section> : <div className={styles.list}>
        {data.reports.map((report) => {
          const isIssue = report.type === 'ISSUE'
          return <article className={styles.card} key={report.id}>
            <div className={styles.cardHead}>
              <strong>{isIssue ? t(report.issueType) : t('vehicleOk')}</strong>
              {isIssue ? <select className={`${styles.statusSelect} ${styles[statusKey(report.status)]}`} value={report.status} onChange={(event) => updateStatus(report.id, event.target.value)}>
                <option value="OPEN">{t('open')}</option><option value="IN_REPAIR">{t('inRepair')}</option><option value="RESOLVED">{t('resolved')}</option>
              </select> : <span className={`${styles.badge} ${styles.ok}`}>OK</span>}
            </div>
            <p>{report.priority && <strong>{t(report.priority)}</strong>}{report.description || '—'}</p>
            {report.signedUrl && report.mediaType === 'image' && <img src={report.signedUrl} alt={t('photo')} />}
            {report.signedUrl && report.mediaType === 'video' && <video controls src={report.signedUrl} />}
            <div className={styles.meta}><span>{t('driver')}: {report.employeeName || '—'}</span><span>{report.date} {report.time}</span></div>
          </article>
        })}
      </div>}
    </main>
  </div>
}

export default AdminVehicle
