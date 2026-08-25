import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { isCompanyLoggedIn, saveAuthenticatedCompanySession } from '../../services/sessionService'
import { apiRequest } from '../../services/apiClient'
import styles from './AdminLogin.module.css'

function AdminLogin() {
  const { t } = useLanguage(); const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  if (isCompanyLoggedIn()) return <Navigate to="/admin/dashboard" replace />
  const submit = async (event) => { event.preventDefault(); setSubmitting(true); setError(''); try { const login = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); saveAuthenticatedCompanySession({ user: login.user, session: login.session }); const identity = await apiRequest('/auth/me'); saveAuthenticatedCompanySession({ ...identity, session: login.session }); navigate('/admin/dashboard') } catch (requestError) { setError(requestError.message || t('loginError')) } finally { setSubmitting(false) } }
  return <div className={styles.page}><Header admin /><main className={styles.main}><form className={styles.card} onSubmit={submit}><div className={styles.icon}>F</div><p className={styles.kicker}>FLEET MANAGEMENT</p><h1>{t('adminLogin')}</h1><label>{t('email')}<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>{t('password')}<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className={styles.error}>{error}</p>}<button type="submit" disabled={submitting}>{t('login')}</button><div className={styles.register}><p>{t('noAccount')}</p><Link to="/company/register">{t('createCompanyAccount')}</Link></div><Link className={styles.back} to="/">{t('backToFleetCheck')}</Link></form></main></div>
}
export default AdminLogin
