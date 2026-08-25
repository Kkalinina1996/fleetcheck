import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { isAdminLoggedIn, loginAdmin } from '../../services/sessionService'
import styles from './AdminLogin.module.css'

function AdminLogin() {
  const { t } = useLanguage(); const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  if (isAdminLoggedIn()) return <Navigate to="/admin/dashboard" replace />
  const submit = (event) => { event.preventDefault(); if (email === 'admin@fleetcheck.local' && password === 'fleetcheck') { loginAdmin(); navigate('/admin/dashboard') } else setError(t('loginError')) }
  return <div className={styles.page}><Header admin /><main className={styles.main}><form className={styles.card} onSubmit={submit}><div className={styles.icon}>F</div><p className={styles.kicker}>FLEET MANAGEMENT</p><h1>{t('adminLogin')}</h1><label>{t('email')}<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>{t('password')}<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className={styles.error}>{error}</p>}<button type="submit">{t('login')}</button><p className={styles.demo}>{t('demoCredentials')}</p></form></main></div>
}
export default AdminLogin
