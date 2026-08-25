import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { createReport } from '../../services/reportService'
import { getVehicleById } from '../../services/vehicleService'
import styles from './PrivateReportIssue.module.css'

const categories = ['tire', 'fuel', 'adBlue', 'oilService', 'lights', 'damage', 'warningLight', 'other']

function fileToDataUrl(file, setValue) {
  const reader = new FileReader()
  reader.onload = () => setValue(reader.result)
  reader.readAsDataURL(file)
}

function PrivateReportIssue() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const photoInput = useRef(null)
  const videoInput = useRef(null)
  const vehicle = getVehicleById(vehicleId)
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')
  const [video, setVideo] = useState('')
  const [saved, setSaved] = useState(false)

  const selectMedia = (event, setValue) => {
    const file = event.target.files?.[0]
    if (file) fileToDataUrl(file, setValue)
  }
  const clearMedia = (input, setValue) => {
    setValue('')
    if (input.current) input.current.value = ''
  }
  const submit = (event) => {
    event.preventDefault()
    if (!issueType || !vehicle) return
    createReport({
      id: crypto.randomUUID(),
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      type: 'ISSUE',
      issueType,
      description: description.trim(),
      photo: photo || null,
      video: video || null,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    })
    setSaved(true)
  }

  if (!vehicle || vehicle.ownerType !== 'private') return <VehicleNotFound />

  return <div className={styles.page}><Header role="privateRole" onAction={() => navigate('/home?mode=private')} actionLabel="myVehicles" /><main className={styles.main}><Link className={styles.back} to="/home?mode=private">{t('myVehicles')}</Link><section className={styles.vehicleInfo}><h1>{vehicle.brand} {vehicle.model}</h1><p>{vehicle.plateNumber}</p></section>{saved ? <section className={styles.success}><div aria-hidden="true">✓</div><h2>{t('reportSent')}</h2><p>{t('issueReportedDetail')}</p><Link to="/home?mode=private">{t('myVehicles')}</Link></section> : <form className={styles.card} onSubmit={submit}><h2>{t('reportProblem')}</h2><div className={styles.categories}>{categories.map((category) => <button className={issueType === category ? styles.selected : ''} key={category} type="button" onClick={() => setIssueType(category)}>{t(category)}</button>)}</div><label>{t('shortDescription')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="5" /></label><div className={styles.mediaActions}><label className={styles.mediaButton}>{t('addPhoto')}<input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={(event) => selectMedia(event, setPhoto)} /></label><label className={styles.mediaButton}>{t('addVideo')}<input ref={videoInput} type="file" accept="video/*" capture="environment" onChange={(event) => selectMedia(event, setVideo)} /></label></div>{photo && <section className={styles.previewBlock}><img src={photo} alt={t('addPhoto')} /><button type="button" onClick={() => clearMedia(photoInput, setPhoto)}>{t('remove')}</button></section>}{video && <section className={styles.previewBlock}><video controls src={video} /><button type="button" onClick={() => clearMedia(videoInput, setVideo)}>{t('remove')}</button></section>}<button className={styles.send} type="submit" disabled={!issueType}>{t('sendReport')}</button></form>}</main></div>
}

export default PrivateReportIssue
