import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { createPrivateReport, getPrivateVehicle } from '../../services/privateApiService'
import styles from './PrivateReportIssue.module.css'

const categories = ['tire', 'fuel', 'adBlue', 'oilService', 'lights', 'damage', 'warningLight', 'accident', 'other']

function PrivateReportIssue() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const photoInput = useRef(null)
  const videoInput = useRef(null)
  const [vehicle, setVehicle] = useState(null)
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [media, setMedia] = useState(null)
  const [preview, setPreview] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getPrivateVehicle(vehicleId).then(setVehicle).catch(() => setVehicle(false)) }, [vehicleId])

  const selectMedia = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setMedia(file)
    setPreview(URL.createObjectURL(file))
  }
  const clearMedia = (input) => {
    setMedia(null)
    setPreview('')
    if (input.current) input.current.value = ''
  }
  const submit = async (event) => {
    event.preventDefault()
    if (!issueType || !vehicle) return
    setError('')
    try { await createPrivateReport({ vehicleId: vehicle.id, type: 'ISSUE', issueType, priority: 'attention', description: description.trim() }, media); setSaved(true) } catch (requestError) { setError(t(requestError.message)) }
  }

  if (vehicle === false) return <VehicleNotFound />
  if (!vehicle) return null

  return <div className={styles.page}><Header role="privateRole" onAction={() => navigate('/home?mode=private')} actionLabel="myVehicles" /><main className={styles.main}><Link className={styles.back} to="/home?mode=private">{t('myVehicles')}</Link><section className={styles.vehicleInfo}><h1>{vehicle.brand} {vehicle.model}</h1><p>{vehicle.plateNumber}</p></section>{saved ? <section className={styles.success}><div aria-hidden="true">✓</div><h2>{t('reportSent')}</h2><p>{t('issueReportedDetail')}</p><Link to="/home?mode=private">{t('myVehicles')}</Link></section> : <form className={styles.card} onSubmit={submit}><h2>{t('reportProblem')}</h2><div className={styles.categories}>{categories.map((category) => <button className={issueType === category ? styles.selected : ''} key={category} type="button" onClick={() => setIssueType(category)}>{t(category)}</button>)}</div><label>{t('shortDescription')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="5" /></label><div className={styles.mediaActions}><label className={styles.mediaButton}>{t('addPhoto')}<input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={selectMedia} /></label><label className={styles.mediaButton}>{t('addVideo')}<input ref={videoInput} type="file" accept="video/*" capture="environment" onChange={selectMedia} /></label></div>{preview && media?.type.startsWith('image/') && <section className={styles.previewBlock}><img src={preview} alt={t('addPhoto')} /><button type="button" onClick={() => clearMedia(photoInput)}>{t('remove')}</button></section>}{preview && media?.type.startsWith('video/') && <section className={styles.previewBlock}><video controls src={preview} /><button type="button" onClick={() => clearMedia(videoInput)}>{t('remove')}</button></section>}{error && <p className={styles.error}>{error}</p>}<button className={styles.send} type="submit" disabled={!issueType}>{t('sendReport')}</button></form>}</main></div>
}

export default PrivateReportIssue
