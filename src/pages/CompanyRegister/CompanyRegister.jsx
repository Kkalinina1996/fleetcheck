import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { saveCompanySession } from '../../services/sessionService'
import styles from './CompanyRegister.module.css'

function CompanyRegister() {
  const { t } = useLanguage(); const navigate = useNavigate(); const [form, setForm] = useState({ companyName: '', adminName: '', email: '', password: '', confirmPassword: '', phone: '' }); const [error, setError] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => { event.preventDefault(); if (form.password !== form.confirmPassword) { setError(t('passwordsDoNotMatch')); return }; saveCompanySession({ companyId: crypto.randomUUID(), companyName: form.companyName.trim(), adminName: form.adminName.trim(), email: form.email.trim(), phone: form.phone.trim(), createdAt: new Date().toISOString() }); navigate('/company/home') }
  return <div className={styles.page}><Header /><main className={styles.main}><form className={styles.card} onSubmit={submit}><h1>{t('createCompanyAccount')}</h1><label>{t('companyName')}<input required value={form.companyName} onChange={(event) => update('companyName', event.target.value)} /></label><label>{t('adminName')}<input required value={form.adminName} onChange={(event) => update('adminName', event.target.value)} /></label><label>{t('email')}<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label>{t('password')}<input required type="password" value={form.password} onChange={(event) => update('password', event.target.value)} /></label><label>{t('confirmPassword')}<input required type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} /></label><label>{t('phone')}<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>{error && <p className={styles.error}>{error}</p>}<button type="submit">{t('continue')}</button></form></main></div>
}
export default CompanyRegister
