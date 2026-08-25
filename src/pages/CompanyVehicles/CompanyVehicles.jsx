import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getActiveVehicleIssues, getVehicleReports } from '../../services/reportService'
import { getCompanySession } from '../../services/sessionService'
import { getCompanyVehicles, updateVehicle } from '../../services/vehicleService'
import styles from './CompanyVehicles.module.css'

function CompanyVehicles() {
  const { t } = useLanguage(); const [searchParams] = useSearchParams(); const company = getCompanySession(); const companyId = company?.companyId || company?.id; const [vehicles, setVehicles] = useState(() => getCompanyVehicles(companyId)); const [editing, setEditing] = useState(null); const reportsOnly = searchParams.get('reports') === 'true'
  const save = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const vehicle = updateVehicle(editing.id, { brand: data.get('brand'), model: data.get('model'), year: data.get('year'), vehicleType: data.get('vehicleType') }); setVehicles((current) => current.map((item) => item.id === vehicle.id ? vehicle : item)); setEditing(null) }
  return <div className={styles.page}><Header allowCompanySignOut role="companyFleet" /><main className={styles.main}><Link to="/company/home">{t('back')}</Link><h1>{reportsOnly ? t('reports') : t('vehicles')}</h1>{editing && <form className={styles.edit} onSubmit={save}><h2>{t('editVehicle')}</h2><input name="brand" defaultValue={editing.brand} required /><input name="model" defaultValue={editing.model} required /><input name="year" defaultValue={editing.year} /><select name="vehicleType" defaultValue={editing.vehicleType}><option value="">{t('optional')}</option>{['car','van','truck','other'].map((type) => <option key={type} value={type}>{t(type)}</option>)}</select><button>{t('save')}</button></form>}<section className={styles.list}>{vehicles.map((vehicle) => { const reports = getVehicleReports(vehicle.id); const active = getActiveVehicleIssues(vehicle.id); return <article className={styles.card} key={vehicle.id}><div><h2>{vehicle.brand} {vehicle.model}</h2><p>{vehicle.plateNumber}</p><small>{active.length ? t('needAttention') : t('vehicleOk')}</small></div>{reportsOnly ? <p>{reports.length ? `${reports.length} ${t('reports').toLowerCase()}` : t('noReports')}</p> : <div className={styles.actions}><Link to={`/admin/vehicle/${vehicle.id}`}>{t('vehicleHistory')}</Link><button type="button" onClick={() => setEditing(vehicle)}>{t('editVehicle')}</button></div>}</article> })}</section><Link className={styles.add} to="/company/setup">{t('addVehicle')}</Link></main></div>
}
export default CompanyVehicles
