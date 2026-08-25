import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { normalizePlateNumber } from '../../data/vehicles'
import { saveDriverSession } from '../../services/sessionService'
import { findVehicleByPlate } from '../../services/vehicleService'
import styles from './DriverManualEntry.module.css'

function DriverManualEntry() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [plateNumber, setPlateNumber] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [notFound, setNotFound] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const vehicle = findVehicleByPlate(plateNumber)
    if (!vehicle || vehicle.ownerType !== 'company') { setNotFound(true); return }
    saveDriverSession({ mode: 'company', vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, employeeName: employeeName.trim(), startedAt: new Date().toISOString() })
    navigate(`/company/check/${vehicle.id}`)
  }

  return <div className={styles.page}><Header /><main className={styles.main}><Link className={styles.back} to="/company">{t('back')}</Link>{notFound ? <section className={styles.card}><h1>{t('vehicleNotFound')}</h1><p className={styles.copy}>{t('companyVehicleNotFoundHint')}</p><Link className={styles.primaryLink} to="/company">{t('back')}</Link></section> : <form className={styles.card} onSubmit={submit}><h1>{t('vehicleCheck')}</h1><p className={styles.copy}>{t('companyCheckHint')}</p><label>{t('vehicleNumber')}<input value={plateNumber} onChange={(event) => setPlateNumber(normalizePlateNumber(event.target.value))} placeholder="e.g. FR AB 1234" autoComplete="off" /></label><label>{t('yourName')}<input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} autoComplete="name" /></label><button className={styles.primary} type="submit" disabled={!plateNumber || !employeeName.trim()}>{t('startVehicleCheck')}</button></form>}</main></div>
}

export default DriverManualEntry
