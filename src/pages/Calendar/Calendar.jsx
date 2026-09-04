import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyVehicles } from '../../services/companyApiService'
import { getPrivateVehicles } from '../../services/privateApiService'
import { completeReminder, createReminder, deleteReminder, getReminders } from '../../services/reminderService'
import { isCompanyAdmin, isPrivateLoggedIn } from '../../services/sessionService'
import styles from './Calendar.module.css'

const types = ['TECHNICAL_INSPECTION', 'INSURANCE', 'SERVICE', 'OIL_CHANGE', 'TIRE_CHANGE', 'OTHER']
function Calendar({ mode }) {
  const { t } = useLanguage(); const privateMode = mode === 'private'; const allowed = privateMode ? isPrivateLoggedIn() : isCompanyAdmin(); const [vehicles, setVehicles] = useState([]); const [items, setItems] = useState([]); const [form, setForm] = useState({ vehicleId: '', reminderType: 'TECHNICAL_INSPECTION', dueDate: '', note: '' })
  const load = () => Promise.all([privateMode ? getPrivateVehicles() : getCompanyVehicles(), getReminders(mode)]).then(([loadedVehicles, reminders]) => { setVehicles(loadedVehicles); setItems(reminders) })
  useEffect(() => { if (allowed) Promise.all([privateMode ? getPrivateVehicles() : getCompanyVehicles(), getReminders(mode)]).then(([loadedVehicles, reminders]) => { setVehicles(loadedVehicles); setItems(reminders) }) }, [allowed, mode, privateMode])
  if (!allowed) return <Navigate to={privateMode ? '/private/auth' : '/company/driver'} replace />
  const isOverdue = (item) => item.status !== 'COMPLETED' && item.due_date < new Date().toISOString().slice(0, 10)
  const submit = async (event) => { event.preventDefault(); await createReminder(mode, form); setForm({ vehicleId: '', reminderType: 'TECHNICAL_INSPECTION', dueDate: '', note: '' }); load() }
  const status = (item) => item.status === 'COMPLETED' ? 'completed' : isOverdue(item) ? 'overdue' : 'upcoming'
  return <div className={styles.page}><Header admin={!privateMode} role={privateMode ? 'privateRole' : 'companyFleet'} /><main className={styles.main}><Link className={styles.back} to={privateMode ? '/home?mode=private' : '/admin/dashboard'}>{t('back')}</Link><header className={styles.heading}><p>{t('reminders')}</p><h1>{t('calendar')}</h1></header><section className={styles.formCard}><h2>{t('addReminder')}</h2><form className={styles.form} onSubmit={submit}><label>{t('vehicle')}<select required value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}><option value="">{t('vehicle')}</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.plateNumber}</option>)}</select></label><label>{t('reminders')}<select value={form.reminderType} onChange={(event) => setForm({ ...form, reminderType: event.target.value })}>{types.map((type) => <option key={type} value={type}>{t(type.toLowerCase())}</option>)}</select></label><label>{t('dueDate')}<input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label><label className={styles.note}>{t('note')}<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label><button className={styles.addButton}>{t('addReminder')}</button></form></section><section className={styles.list}><h2>{t('reminders')}</h2>{items.length === 0 ? <div className={styles.empty}>{t('noReminders')}</div> : items.map((item) => <article className={`${styles.card} ${styles[status(item)]}`} key={item.id}><div className={styles.cardHead}><div><strong>{item.vehicles?.plate_number}</strong><span>{t(item.reminder_type.toLowerCase())}</span></div><span className={styles.badge}>{t(status(item))}</span></div><time>{item.due_date}</time>{item.note && <p>{item.note}</p>}<div className={styles.actions}>{item.status !== 'COMPLETED' && <button onClick={() => completeReminder(mode, item.id).then(load)}>{t('markCompleted')}</button>}<button className={styles.deleteButton} onClick={() => deleteReminder(mode, item.id).then(load)}>{t('delete')}</button></div></article>)}</section></main></div>
}
export default Calendar
