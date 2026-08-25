import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { normalizePlateNumber } from '../../data/vehicles'
import { createReport } from '../../services/reportService'
import { createVehicle, findVehicleByPlate, getAllVehicles } from '../../services/vehicleService'
import styles from './PrivateHome.module.css'

const brands = ['Renault', 'Volkswagen', 'Fiat', 'Other']

function PrivateHome() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState(() => getAllVehicles().filter((vehicle) => vehicle.ownerType === 'private'))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: '', model: '', plateNumber: '', year: '' })
  const [error, setError] = useState('')
  const [okVehicleId, setOkVehicleId] = useState('')

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const saveVehicle = (event) => {
    event.preventDefault()
    const plateNumber = normalizePlateNumber(form.plateNumber)
    if (findVehicleByPlate(plateNumber)) {
      setError(t('vehicleAlreadyExists'))
      return
    }
    const vehicle = createVehicle({ ...form, plateNumber, ownerType: 'private' })
    setVehicles((current) => [...current, vehicle])
    setForm({ brand: '', model: '', plateNumber: '', year: '' })
    setError('')
    setShowForm(false)
  }
  const markVehicleOk = (vehicle) => {
    createReport({ vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, type: 'VEHICLE_OK', status: 'OK' })
    setOkVehicleId(vehicle.id)
  }

  return <div className={styles.page}><Header role="privateRole" /><main className={styles.main}><section className={styles.intro}><h1>{t('myVehicles')}</h1><p>{t('privateHomeHint')}</p></section>{showForm ? <form className={styles.formCard} onSubmit={saveVehicle}><h2>{t('addVehicle')}</h2><label>{t('brand')}<select required value={form.brand} onChange={(event) => updateField('brand', event.target.value)}><option value="" disabled>{t('selectBrand')}</option>{brands.map((brand) => <option key={brand} value={brand}>{brand === 'Other' ? t('other') : brand}</option>)}</select></label><label>{t('model')}<input required value={form.model} onChange={(event) => updateField('model', event.target.value)} autoComplete="off" /></label><label>{t('licensePlate')}<input required value={form.plateNumber} onChange={(event) => updateField('plateNumber', normalizePlateNumber(event.target.value))} autoComplete="off" /></label><label>{t('year')}<input value={form.year} onChange={(event) => updateField('year', event.target.value)} inputMode="numeric" maxLength="4" autoComplete="off" /></label>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} type="submit">{t('saveVehicle')}</button><button className={styles.cancel} type="button" onClick={() => { setShowForm(false); setError('') }}>{t('cancel')}</button></form> : <>{vehicles.length === 0 ? <section className={styles.empty}><div className={styles.emptyIcon} aria-hidden="true">▱</div><button className={styles.primary} type="button" onClick={() => setShowForm(true)}>{t('addVehicle')}</button></section> : <><section className={styles.vehicleList}>{vehicles.map((vehicle) => <article className={styles.vehicleCard} key={vehicle.id}><div><h2>{vehicle.brand} {vehicle.model}</h2><p className={styles.plate}>{vehicle.plateNumber}</p>{vehicle.year && <p className={styles.year}>{vehicle.year}</p>}</div><div className={styles.actions}><button className={styles.okButton} type="button" onClick={() => markVehicleOk(vehicle)}>{t('vehicleOk')}</button><button className={styles.secondaryButton} type="button" onClick={() => navigate(`/home/private/vehicle/${vehicle.id}/report`)}>{t('reportProblem')}</button><button className={styles.secondaryButton} type="button" disabled>{t('vehicleHistory')}</button><button className={styles.secondaryButton} type="button" disabled>{t('photosVideos')}</button></div>{okVehicleId === vehicle.id && <p className={styles.success} role="status">{t('vehicleOkSaved')}</p>}</article>)}</section><button className={styles.addAnother} type="button" onClick={() => setShowForm(true)}>{t('addVehicle')}</button></>}</>}</main></div>
}

export default PrivateHome
