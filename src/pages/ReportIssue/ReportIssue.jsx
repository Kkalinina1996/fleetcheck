import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { clearCheckIn, createReportDate, getCheckIn, getVehicleById, hasDriverSession, saveNotification, saveReport } from '../../lib/storage'
import VehicleNotFound from '../../components/VehicleNotFound/VehicleNotFound'
import styles from './ReportIssue.module.css'

const categories = ['tire', 'fuel', 'adBlue', 'oilService', 'lights', 'damage', 'warningLight', 'other']
function ReportIssue() {
  const { vehicleId } = useParams(); const { t } = useLanguage(); const navigate = useNavigate(); const vehicle = getVehicleById(vehicleId); const isCheckedIn = vehicle && hasDriverSession(vehicle.id); const [issueType, setIssueType] = useState(''); const [description, setDescription] = useState(''); const [photo, setPhoto] = useState(''); const [saved, setSaved] = useState(false)
  const selectPhoto = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPhoto(reader.result); reader.readAsDataURL(file) }
  const submit = (event) => { event.preventDefault(); if (!issueType) return; const checkIn = getCheckIn() || {}; const report = { id: crypto.randomUUID(), vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, depot: checkIn.depot || '-', driverName: checkIn.driverName || '-', type: 'ISSUE', issueType, description: description.trim(), photo, status: 'OPEN', ...createReportDate() }; saveReport(report); saveNotification({ id: crypto.randomUUID(), type: 'NEW_ISSUE', reportId: report.id, vehicleId: report.vehicleId, plateNumber: report.plateNumber, depot: report.depot, driverName: report.driverName, issueType: report.issueType, description: report.description, createdAt: report.timestamp, read: false }); setSaved(true) }
  const endShift = () => { clearCheckIn(); navigate('/home') }
  if (!vehicle) return <VehicleNotFound />
  return <div className={styles.page}><Header onAction={isCheckedIn ? endShift : undefined} actionLabel="endShift" /><main className={styles.main}><Link className={styles.back} to={`/vehicle/${vehicleId}/check`}>← {t('back')}</Link><p className={styles.vehicle}>{vehicle.plateNumber}</p>{saved ? <section className={styles.success}><div>✓</div><p>{t('reportSent')}</p><h1>{t('vehicle')}: {vehicle.plateNumber}</h1><p className={styles.thanks}>{t('thankYou')}<br />{t('issueReportedDetail')}</p><Link to={`/vehicle/${vehicleId}`}>{t('back')}</Link></section> : <form className={styles.card} onSubmit={submit}><h1>{t('reportProblem')}</h1><div className={styles.categories}>{categories.map((category) => <button type="button" key={category} className={issueType === category ? styles.selected : ''} onClick={() => setIssueType(category)}>{t(category)}</button>)}</div><label>{t('description')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="4" /></label><label className={styles.upload}>{t('addPhoto')}<input type="file" accept="image/*" capture="environment" onChange={selectPhoto} /></label>{photo && <img className={styles.preview} src={photo} alt={t('photo')} />}<button className={styles.send} type="submit" disabled={!issueType}>{t('sendReport')}</button></form>}</main></div>
}
export default ReportIssue
