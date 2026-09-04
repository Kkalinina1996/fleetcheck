import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { createCompanyReport, getCompanyVehicle } from '../../services/companyApiService'
import { clearDriverSession, getCompanySession, isCompanyLoggedIn } from '../../services/sessionService'
import styles from './CompanyReportIssue.module.css'

const categories = [
  { value: 'tiresWheels', label: 'tiresWheels' },
  { value: 'engine', label: 'engine' },
  { value: 'brakes', label: 'brakes' },
  { value: 'lights', label: 'lighting' },
  { value: 'bodyDamage', label: 'bodyDamage' },
  { value: 'interior', label: 'interior' },
  { value: 'fluidOil', label: 'fluidOil' },
  { value: 'warningLight', label: 'warningLight' },
  { value: 'other', label: 'other' },
]

function CompanyReportIssue() {
  const { vehicleId } = useParams(); const { t } = useLanguage(); const navigate = useNavigate(); const session = getCompanySession(); const [vehicle, setVehicle] = useState(null); const [issueType, setIssueType] = useState(''); const [priority, setPriority] = useState('attention'); const [description, setDescription] = useState(''); const [media, setMedia] = useState(null); const [preview, setPreview] = useState(''); const [done, setDone] = useState(false); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false); const photoRef = useRef(null); const videoRef = useRef(null)
  useEffect(() => { if (isCompanyLoggedIn()) getCompanyVehicle(vehicleId).then(setVehicle).catch(() => setVehicle(false)) }, [vehicleId])
  const select = (event) => { const file = event.target.files?.[0]; if (!file) return; setMedia(file); setPreview(URL.createObjectURL(file)) }
  const remove = (ref) => { setMedia(null); setPreview(''); if (ref.current) ref.current.value = '' }
  const submit = async (event) => { event.preventDefault(); if (!issueType || !vehicle) return; setSubmitting(true); setError(''); try { await createCompanyReport({ vehicleId: vehicle.id, employeeName: session?.profile?.full_name || '', type: 'ISSUE', issueType, priority, description: description.trim() }, media); setDone(true) } catch (requestError) { setError(requestError.message) } finally { setSubmitting(false) } }
  const finishCheck = () => { clearDriverSession(); navigate(session?.role === 'EMPLOYEE' ? '/company/driver' : '/company/home') }
  if (!isCompanyLoggedIn()) return <Navigate to={`/company/driver/login?next=${encodeURIComponent(`/company/check/${vehicleId}/report`)}`} replace />
  if (vehicle === false) return <VehicleNotFound />
  return <div className={styles.page}><Header allowCompanySignOut role={session?.role === 'EMPLOYEE' ? 'employeeRole' : 'companyFleet'} /><main className={styles.main}>{done ? <section className={styles.card}><h1>{t('reportSent')}</h1><p>{t('vehicle')}: {vehicle?.plateNumber}<br />{t('employee')}: {session?.profile?.full_name || ''}</p><button type="button" onClick={finishCheck}>{t('finishCheck')}</button><button type="button" onClick={() => navigate(session?.role === 'EMPLOYEE' ? '/company/driver' : '/company/home')}>{t('returnToCompanyHome')}</button></section> : <form className={styles.card} onSubmit={submit}><h1>{t('reportProblem')}</h1><div className={styles.categories}>{categories.map(({ value, label }) => <button className={issueType === value ? styles.selected : ''} type="button" key={value} onClick={() => setIssueType(value)}>{t(label)}</button>)}</div><section className={styles.prioritySection} aria-label={t('priority')}><h2>{t('priority')}</h2><div className={styles.priorityOptions}><button className={priority === 'attention' ? styles.prioritySelected : ''} type="button" aria-pressed={priority === 'attention'} onClick={() => setPriority('attention')}>{t('attentionNeeded')}</button><button className={priority === 'urgent' ? styles.prioritySelected : ''} type="button" aria-pressed={priority === 'urgent'} onClick={() => setPriority('urgent')}>{t('urgent')}</button></div></section><label>{t('shortDescription')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className={styles.media}><label>{t('addPhoto')}<input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" onChange={select} /></label><label>{t('addVideo')}<input ref={videoRef} type="file" accept="video/mp4,video/quicktime" capture="environment" onChange={select} /></label></div>{preview && media?.type.startsWith('image/') && <section className={styles.preview}><img src={preview} alt={t('photo')} /><button type="button" onClick={() => remove(photoRef)}>{t('remove')}</button></section>}{preview && media?.type.startsWith('video/') && <section className={styles.preview}><video controls src={preview} /><button type="button" onClick={() => remove(videoRef)}>{t('remove')}</button></section>}{error && <p>{error}</p>}<button disabled={!issueType || submitting || !vehicle}>{t('sendReport')}</button></form>}</main></div>
}
export default CompanyReportIssue
