import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { createPrivateReport, getPrivateVehicle } from '../../services/privateApiService'
import styles from './PrivateVehicleOk.module.css'

function PrivateVehicleOk() {
  const { vehicleId } = useParams(); const { t } = useLanguage(); const navigate = useNavigate(); const [vehicle, setVehicle] = useState(null); const photoInput = useRef(null); const videoInput = useRef(null); const [media, setMedia] = useState(null); const [preview, setPreview] = useState(''); const [saved, setSaved] = useState(false); const [error, setError] = useState('')
  useEffect(() => { getPrivateVehicle(vehicleId).then(setVehicle).catch(() => setVehicle(false)) }, [vehicleId])
  const select = (event) => { const file = event.target.files?.[0]; if (!file) return; setMedia(file); setPreview(URL.createObjectURL(file)) }
  const remove = (ref) => { setMedia(null); setPreview(''); if (ref.current) ref.current.value = '' }
  const submit = async () => { setError(''); try { await createPrivateReport({ vehicleId: vehicle.id, type: 'VEHICLE_OK' }, media); setSaved(true) } catch (requestError) { setError(t(requestError.message)) } }
  if (vehicle === false) return <VehicleNotFound />
  if (!vehicle) return null
  return <div className={styles.page}><Header role="privateRole" onAction={() => navigate('/home?mode=private')} actionLabel="myVehicles" /><main className={styles.main}><Link to="/home?mode=private">{t('myVehicles')}</Link><section className={styles.card}>{saved ? <><div className={styles.tick}>✓</div><h1>{t('vehicleOkSaved')}</h1><Link to={`/home/private/vehicle/${vehicle.id}/history`}>{t('vehicleHistory')}</Link></> : <><h1>{t('vehicleOk')}</h1><p>{vehicle.brand} {vehicle.model}<br /><strong>{vehicle.plateNumber}</strong></p><div className={styles.media}><label>{t('addPhoto')}<input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={select} /></label><label>{t('addVideo')}<input ref={videoInput} type="file" accept="video/*" capture="environment" onChange={select} /></label></div>{preview && media?.type.startsWith('image/') && <div className={styles.preview}><img src={preview} alt={t('photo')} /><button type="button" onClick={() => remove(photoInput)}>{t('remove')}</button></div>}{preview && media?.type.startsWith('video/') && <div className={styles.preview}><video controls src={preview} /><button type="button" onClick={() => remove(videoInput)}>{t('remove')}</button></div>}{error && <p className={styles.error}>{error}</p>}<button className={styles.primary} type="button" onClick={submit}>{t('save')}</button></>}</section></main></div>
}
export default PrivateVehicleOk
