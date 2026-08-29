import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyVehicles } from '../../services/companyApiService'
import { getPrivateVehicles } from '../../services/privateApiService'
import { completeReminder, createReminder, deleteReminder, getReminders } from '../../services/reminderService'
import { isCompanyLoggedIn, isPrivateLoggedIn } from '../../services/sessionService'
import styles from './Calendar.module.css'
const types = ['TECHNICAL_INSPECTION', 'INSURANCE', 'SERVICE', 'OIL_CHANGE', 'TIRE_CHANGE', 'OTHER']
function Calendar({ mode }) {
 const { t } = useLanguage(); const [vehicles,setVehicles]=useState([]); const [items,setItems]=useState([]); const [form,setForm]=useState({vehicleId:'',reminderType:'TECHNICAL_INSPECTION',dueDate:'',note:''}); const privateMode=mode==='private'; const allowed=privateMode?isPrivateLoggedIn():isCompanyLoggedIn()
 const load=()=>Promise.all([privateMode?getPrivateVehicles():getCompanyVehicles(),getReminders(mode)]).then(([v,r])=>{setVehicles(v);setItems(r)})
 useEffect(()=>{if(allowed)Promise.all([privateMode?getPrivateVehicles():getCompanyVehicles(),getReminders(mode)]).then(([v,r])=>{setVehicles(v);setItems(r)})},[allowed,mode,privateMode])
 if(!allowed)return <Navigate to={privateMode?'/private/auth':'/admin'} replace />
 const overdue=(item)=>item.status!=='COMPLETED'&&item.due_date<new Date().toISOString().slice(0,10)
 const submit=async(e)=>{e.preventDefault();await createReminder(mode,form);setForm({vehicleId:'',reminderType:'TECHNICAL_INSPECTION',dueDate:'',note:''});load()}
 return <div className={styles.page}><Header admin={!privateMode} role={privateMode?'privateRole':'companyFleet'} /><main className={styles.main}><Link to={privateMode?'/home?mode=private':'/admin/dashboard'}>{t('back')}</Link><h1>{t('calendar')}</h1><form className={styles.form} onSubmit={submit}><select required value={form.vehicleId} onChange={e=>setForm({...form,vehicleId:e.target.value})}><option value="">{t('vehicle')}</option>{vehicles.map(v=><option value={v.id} key={v.id}>{v.plateNumber}</option>)}</select><select value={form.reminderType} onChange={e=>setForm({...form,reminderType:e.target.value})}>{types.map(x=><option key={x} value={x}>{t(x.toLowerCase())}</option>)}</select><input required type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/><input placeholder={t('note')} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/><button>{t('addReminder')}</button></form><section className={styles.list}>{items.map(item=><article className={`${styles.card} ${overdue(item)?styles.overdue:''}`} key={item.id}><strong>{item.vehicles?.plate_number} · {t(item.reminder_type.toLowerCase())}</strong><span>{item.due_date} · {item.status==='COMPLETED'?t('completed'):overdue(item)?t('overdue'):t('upcoming')}</span>{item.note&&<p>{item.note}</p>}<div>{item.status!=='COMPLETED'&&<button onClick={()=>completeReminder(mode,item.id).then(load)}>{t('markCompleted')}</button>}<button onClick={()=>deleteReminder(mode,item.id).then(load)}>{t('delete')}</button></div></article>)}</section></main></div>
}
export default Calendar
