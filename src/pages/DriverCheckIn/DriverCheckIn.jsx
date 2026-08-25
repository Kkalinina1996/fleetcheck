import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getActiveIssues, getVehicleById, saveCheckIn } from '../../lib/storage'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import styles from './DriverCheckIn.module.css'

function DriverCheckIn() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [driverName, setDriverName] = useState('')
  const [tlNumber, setTlNumber] = useState('')
  const [depot, setDepot] = useState('')
  const submit = (event) => {
    event.preventDefault()
    const vehicle = getVehicleById(vehicleId)
    saveCheckIn({ depot, vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, driverName: driverName.trim(), tlNumber: tlNumber.trim() })
    navigate(getActiveIssues(vehicle.id).length ? `/vehicle/${vehicleId}/issues` : `/vehicle/${vehicleId}/check`)
  }
  const vehicle = getVehicleById(vehicleId)
  if (!vehicle) return <VehicleNotFound />
  return <div className={styles.page}><Header /><main className={styles.main}><div className={styles.card}><p className={styles.eyebrow}>{t('vehicle')}</p><h1>{vehicle.plateNumber}</h1><p className={styles.copy}>{t('checkInHint')}</p><form onSubmit={submit}><fieldset><legend>{t('depot')}</legend><div className={styles.depots}>{['GLS', 'DPD'].map((option) => <button className={depot === option ? styles.selected : ''} type="button" key={option} onClick={() => setDepot(option)}>{option}</button>)}</div></fieldset><label>{t('driverName')}<input required value={driverName} onChange={(event) => setDriverName(event.target.value)} autoComplete="name" /></label><label>{t('tlNumber')}<input required value={tlNumber} onChange={(event) => setTlNumber(event.target.value)} inputMode="numeric" /></label><button className={styles.primary} type="submit" disabled={!depot}>{t('startVehicleCheck')}</button></form></div></main></div>
}
export default DriverCheckIn
