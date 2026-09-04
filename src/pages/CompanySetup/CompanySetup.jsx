import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { normalizePlateNumber } from '../../data/vehicles'
import VehicleBrandCombobox from '../../components/VehicleBrandCombobox/VehicleBrandCombobox'
import { getCompanySession, isCompanyAdmin } from '../../services/sessionService'
import { createCompanyVehicle } from '../../services/companyApiService'
import styles from './CompanySetup.module.css'

const vehicleTypes = ['car', 'van', 'truck', 'other']

function CompanySetup() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const company = getCompanySession()
  const companyName = company?.companyName || company?.name || ''
  const [form, setForm] = useState({ plateNumber: '', brand: '', model: '', year: '', vehicleType: '' })
  const [customBrand, setCustomBrand] = useState('')
  const [error, setError] = useState('')
  const [vehicle, setVehicle] = useState(null)
  const [saving, setSaving] = useState(false)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const resetForm = () => { setForm({ plateNumber: '', brand: '', model: '', year: '', vehicleType: '' }); setCustomBrand(''); setError(''); setVehicle(null) }
  const submit = async (event) => {
    event.preventDefault()
    if (!form.brand || (form.brand === 'Other' && !customBrand.trim())) {
      setError(t('selectBrand'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const savedVehicle = await createCompanyVehicle({ ...form, brand: form.brand === 'Other' ? customBrand.trim() : form.brand, plateNumber: normalizePlateNumber(form.plateNumber), year: form.year ? Number(form.year) : null })
      setVehicle(savedVehicle)
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }
  if (!isCompanyAdmin()) return <Navigate to="/company/driver" replace />
  return <div className={styles.page}><Header allowCompanySignOut role="companyFleet" /><main className={styles.main}>{vehicle ? <section className={styles.success}><div aria-hidden="true">✓</div><h1>{t('vehicleAdded')}</h1><h2>{vehicle.brand} {vehicle.model}</h2><p className={styles.plate}>{vehicle.plateNumber}</p><p>{t('firstVehicleReady')}</p><div className={styles.successActions}><button className={styles.secondary} type="button" onClick={resetForm}>{t('addAnotherVehicle')}</button><button className={styles.primary} type="button" onClick={() => navigate('/company/home')}>{t('goToCompanyHome')}</button></div></section> : <section className={styles.card}><button className={styles.back} type="button" onClick={() => navigate('/company/home')}>{t('backToCompanyHome')}</button><h1>{t('welcomeToFleetCheck')}</h1><p className={styles.subtitle}>{t('firstVehiclePrompt')}</p>{companyName && <p className={styles.companyName}>{companyName}</p>}<form onSubmit={submit}><label>{t('licensePlate')}<input required value={form.plateNumber} onChange={(event) => updateField('plateNumber', normalizePlateNumber(event.target.value))} autoComplete="off" /></label><label>{t('brand')}<VehicleBrandCombobox value={form.brand} onChange={(brand) => updateField('brand', brand)} /></label>{form.brand === 'Other' && <label>{t('enterVehicleBrand')}<input required value={customBrand} onChange={(event) => setCustomBrand(event.target.value)} autoComplete="organization" /></label>}<label>{t('model')}<input required value={form.model} onChange={(event) => updateField('model', event.target.value)} autoComplete="off" /></label><label>{t('year')}<input value={form.year} onChange={(event) => updateField('year', event.target.value)} inputMode="numeric" maxLength="4" autoComplete="off" /></label><label>{t('vehicleType')}<select value={form.vehicleType} onChange={(event) => updateField('vehicleType', event.target.value)}><option value="">{t('optional')}</option>{vehicleTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}</select></label>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} type="submit" disabled={saving}>{t('addVehicle')}</button></form></section>}</main></div>
}

export default CompanySetup
