import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { clearCheckIn, createReportDate, getCheckIn, getVehicleById, hasDriverSession, saveReport } from '../../lib/storage'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import styles from './VehicleCheck.module.css'

function VehicleCheck() {
  const { vehicleId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const vehicle = getVehicleById(vehicleId)
  const isCheckedIn = vehicle && hasDriverSession(vehicle.id)
  const [saved, setSaved] = useState(false)
  const handleOk = () => {
    const checkIn = getCheckIn() || {}
    saveReport({ id: crypto.randomUUID(), vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, depot: checkIn.depot || '-', driverName: checkIn.driverName || '-', type: 'VEHICLE_OK', issueType: null, description: '', photo: null, status: 'OK', ...createReportDate() })
    setSaved(true)
  }
  const endShift = () => { clearCheckIn(); navigate('/home') }
  if (!vehicle) return <VehicleNotFound />
  return <div className={styles.page}><Header onAction={isCheckedIn ? endShift : undefined} actionLabel="endShift" /><main className={styles.main}><div className={styles.vehicle}>{vehicle.plateNumber}</div>{saved ? <section className={styles.success}><div>✓</div><p>{t('success')}</p><h1>{t('vehicleCheckSaved')}</h1><Link to={`/vehicle/${vehicleId}`}>{t('back')}</Link></section> : <section className={styles.card}><small>{t('beforeDriving')}</small><p>{t('vehicleOk')}</p><div className={styles.actions}><button className={styles.ok} type="button" onClick={handleOk}>✓ {t('everythingOk')}</button><button className={styles.issue} type="button" onClick={() => navigate(`/vehicle/${vehicleId}/report`)}>! {t('reportProblem')}</button></div></section>}</main></div>
}
export default VehicleCheck
