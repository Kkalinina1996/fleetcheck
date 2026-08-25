import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import { useLanguage } from '../../context/LanguageContext'
import { createReport } from '../../services/reportService'
import { getVehicleById } from '../../services/vehicleService'
import styles from './PrivateVehicleOk.module.css'

function PrivateVehicleOk() {
  const { vehicleId } = useParams(); const { t } = useLanguage(); const navigate = useNavigate(); const vehicle = getVehicleById(vehicleId); const photoInput = useRef(null); const videoInput = useRef(null); const [photo, setPhoto] = useState(''); const [video, setVideo] = useState(''); const [saved, setSaved] = useState(false)
  const select = (event, setValue) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setValue(reader.result); reader.readAsDataURL(file) }
  const remove = (ref, setValue) => { setValue(''); if (ref.current) ref.current.value = '' }
  const submit = () => { createReport({ vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, type: 'VEHICLE_OK', status: 'OK', photo: photo || null, video: video || null }); setSaved(true) }
  if (!vehicle || vehicle.ownerType !== 'private') return <VehicleNotFound />
  return <div className={styles.page}><Header role="privateRole" onAction={() => navigate('/home?mode=private')} actionLabel="myVehicles" /><main className={styles.main}><Link to="/home?mode=private">{t('myVehicles')}</Link><section className={styles.card}>{saved ? <><div className={styles.tick}>✓</div><h1>{t('vehicleOkSaved')}</h1><Link to={`/home/private/vehicle/${vehicle.id}/history`}>{t('vehicleHistory')}</Link></> : <><h1>{t('vehicleOk')}</h1><p>{vehicle.brand} {vehicle.model}<br /><strong>{vehicle.plateNumber}</strong></p><div className={styles.media}><label>{t('addPhoto')}<input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={(event) => select(event, setPhoto)} /></label><label>{t('addVideo')}<input ref={videoInput} type="file" accept="video/*" capture="environment" onChange={(event) => select(event, setVideo)} /></label></div>{photo && <div className={styles.preview}><img src={photo} alt={t('photo')} /><button type="button" onClick={() => remove(photoInput, setPhoto)}>{t('remove')}</button></div>}{video && <div className={styles.preview}><video controls src={video} /><button type="button" onClick={() => remove(videoInput, setVideo)}>{t('remove')}</button></div>}<button className={styles.primary} type="button" onClick={submit}>{t('save')}</button></>}</section></main></div>
}
export default PrivateVehicleOk
