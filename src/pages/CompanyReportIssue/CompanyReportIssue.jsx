import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { createNotification } from '../../services/notificationService'
import { createReport } from '../../services/reportService'
import { clearDriverSession, getDriverSession } from '../../services/sessionService'
import { getVehicleById } from '../../services/vehicleService'
import styles from './CompanyReportIssue.module.css'

const categories = ['tire', 'fuel', 'adBlue', 'oilService', 'lights', 'damage', 'warningLight', 'accident', 'other']
function CompanyReportIssue() {
  const { vehicleId } = useParams(); const { t } = useLanguage(); const navigate = useNavigate(); const vehicle = getVehicleById(vehicleId); const session = getDriverSession(); const [issueType, setIssueType] = useState(''); const [description, setDescription] = useState(''); const [photo, setPhoto] = useState(''); const [video, setVideo] = useState(''); const [done, setDone] = useState(false); const photoRef = useRef(null); const videoRef = useRef(null)
  if (!vehicle || vehicle.ownerType !== 'company') return <VehicleNotFound />
  const select = (event, setValue) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setValue(reader.result); reader.readAsDataURL(file) }
  const remove = (ref, setValue) => { setValue(''); if (ref.current) ref.current.value = '' }
  const submit = (event) => { event.preventDefault(); if (!issueType) return; const report = createReport({ companyId: vehicle.companyId, vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, employeeName: session?.employeeName || '', type: 'ISSUE', issueType, description: description.trim(), photo: photo || null, video: video || null, status: 'OPEN' }); createNotification({ id: crypto.randomUUID(), type: 'NEW_ISSUE', reportId: report.id, companyId: vehicle.companyId, vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, employeeName: session?.employeeName || '', issueType, createdAt: report.createdAt, read: false }); setDone(true) }
  const finishCheck = () => { clearDriverSession(); navigate('/company/check') }
  return <div className={styles.page}><Header /><main className={styles.main}>{done ? <section className={styles.card}><h1>{t('checkComplete')}</h1><p>{t('vehicle')}: {vehicle.plateNumber}<br />{t('employee')}: {session?.employeeName || ''}</p><button type="button" onClick={finishCheck}>{t('finishCheck')}</button><button type="button" onClick={() => navigate('/company/home')}>{t('returnToCompanyHome')}</button></section> : <form className={styles.card} onSubmit={submit}><h1>{t('reportProblem')}</h1><div className={styles.categories}>{categories.map((item) => <button className={issueType === item ? styles.selected : ''} type="button" key={item} onClick={() => setIssueType(item)}>{t(item)}</button>)}</div><label>{t('shortDescription')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className={styles.media}><label>{t('addPhoto')}<input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={(event) => select(event, setPhoto)} /></label><label>{t('addVideo')}<input ref={videoRef} type="file" accept="video/*" capture="environment" onChange={(event) => select(event, setVideo)} /></label></div>{photo && <section className={styles.preview}><img src={photo} alt={t('photo')} /><button type="button" onClick={() => remove(photoRef, setPhoto)}>{t('remove')}</button></section>}{video && <section className={styles.preview}><video controls src={video} /><button type="button" onClick={() => remove(videoRef, setVideo)}>{t('remove')}</button></section>}<button disabled={!issueType}>{t('sendReport')}</button></form>}</main></div>
}
export default CompanyReportIssue
