import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { normalizePlateNumber } from '../../data/vehicles'
import VehicleBrandCombobox from '../../components/VehicleBrandCombobox/VehicleBrandCombobox'
import { createPrivateVehicle, getPrivateVehicles } from '../../services/privateApiService'
import { isPrivateLoggedIn } from '../../services/sessionService'
import styles from './PrivateHome.module.css'

function PrivateHome() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: '', model: '', plateNumber: '', year: '', vehicleType: '' })
  const [customBrand, setCustomBrand] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPrivateVehicles().then(setVehicles).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const saveVehicle = async (event) => {
    event.preventDefault()
    if (!form.brand || (form.brand === 'Other' && !customBrand.trim())) {
      setError(t('selectBrand'))
      return
    }
    const plateNumber = normalizePlateNumber(form.plateNumber)
    try {
      const vehicle = await createPrivateVehicle({ ...form, brand: form.brand === 'Other' ? customBrand.trim() : form.brand, plateNumber, year: form.year ? Number(form.year) : null })
      setVehicles((current) => [vehicle, ...current])
      setForm({ brand: '', model: '', plateNumber: '', year: '', vehicleType: '' })
      setCustomBrand('')
      setError('')
      setShowForm(false)
    } catch (requestError) {
      setError(t(requestError.message))
    }
  }
  const markVehicleOk = (vehicle) => navigate(`/home/private/vehicle/${vehicle.id}/ok`)

  if (!isPrivateLoggedIn()) return <Navigate to="/private/auth" replace />
  return <div className={styles.page}><Header role="privateRole" /><main className={styles.main}><section className={styles.intro}><h1>{t('myVehicles')}</h1><p>{t('privateHomeHint')}</p></section>{loading ? <p>{t('loading')}</p> : showForm ? <form className={styles.formCard} onSubmit={saveVehicle}><h2>{t('addVehicle')}</h2><label>{t('brand')}<VehicleBrandCombobox value={form.brand} onChange={(brand) => updateField('brand', brand)} /></label>{form.brand === 'Other' && <label>{t('enterVehicleBrand')}<input required value={customBrand} onChange={(event) => setCustomBrand(event.target.value)} autoComplete="organization" /></label>}<label>{t('model')}<input required value={form.model} onChange={(event) => updateField('model', event.target.value)} autoComplete="off" /></label><label>{t('licensePlate')}<input required value={form.plateNumber} onChange={(event) => updateField('plateNumber', normalizePlateNumber(event.target.value))} autoComplete="off" /></label><label>{t('year')}<input value={form.year} onChange={(event) => updateField('year', event.target.value)} inputMode="numeric" maxLength="4" autoComplete="off" /></label><label>{t('vehicleType')}<select value={form.vehicleType} onChange={(event) => updateField('vehicleType', event.target.value)}><option value="">{t('optional')}</option>{['car', 'van', 'truck', 'other'].map((type) => <option key={type} value={type}>{t(type)}</option>)}</select></label>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} type="submit">{t('saveVehicle')}</button><button className={styles.cancel} type="button" onClick={() => { setShowForm(false); setError('') }}>{t('cancel')}</button></form> : <><p className={styles.count}>{t('vehicleCount')}: {vehicles.length}</p>{vehicles.length === 0 ? <section className={styles.empty}><div className={styles.emptyIcon} aria-hidden="true">▱</div><button className={styles.primary} type="button" onClick={() => setShowForm(true)}>{t('addVehicle')}</button></section> : <><section className={styles.vehicleList}>{vehicles.map((vehicle) => <article className={styles.vehicleCard} key={vehicle.id}><div><h2>{vehicle.brand} {vehicle.model}</h2><p className={styles.plate}>{vehicle.plateNumber}</p>{vehicle.year && <p className={styles.year}>{vehicle.year}</p>}</div><div className={styles.actions}><button className={styles.okButton} type="button" onClick={() => markVehicleOk(vehicle)}>{t('vehicleOk')}</button><button className={styles.secondaryButton} type="button" onClick={() => navigate(`/home/private/vehicle/${vehicle.id}/report`)}>{t('reportProblem')}</button><button className={styles.secondaryButton} type="button" onClick={() => navigate(`/home/private/vehicle/${vehicle.id}/history`)}>{t('vehicleHistory')}</button><button className={styles.secondaryButton} type="button" onClick={() => navigate(`/home/private/vehicle/${vehicle.id}/history?media=true`)}>{t('photosVideos')}</button></div></article>)}</section><button className={styles.addAnother} type="button" onClick={() => setShowForm(true)}>{t('addVehicle')}</button></>}</>}</main></div>
}

export default PrivateHome
