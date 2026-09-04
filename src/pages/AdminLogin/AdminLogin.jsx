import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { clearCompanySession, getCompanyMemberships, hasCompanyAuthentication, isCompanyAdmin, isCompanyEmployee, saveAuthenticatedCompanySession } from '../../services/sessionService'
import { apiRequest } from '../../services/apiClient'
import styles from './AdminLogin.module.css'

function AdminLogin() {
  const { t } = useLanguage(); const navigate = useNavigate(); const [searchParams] = useSearchParams(); const qrToken = searchParams.get('qr'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  if (isCompanyAdmin()) return <Navigate to={qrToken ? `/v/${encodeURIComponent(qrToken)}` : '/admin/dashboard'} replace />
  if (isCompanyEmployee()) return <Navigate to={qrToken ? `/v/${encodeURIComponent(qrToken)}` : '/company/driver'} replace />
  if (hasCompanyAuthentication() && getCompanyMemberships().some((membership) => membership.role === 'COMPANY_ADMIN')) return <Navigate to={`/company/select?role=COMPANY_ADMIN&next=${encodeURIComponent(qrToken ? `/v/${qrToken}` : '/admin/dashboard')}`} replace />
  const submit = async (event) => { event.preventDefault(); setSubmitting(true); setError(''); try { const login = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); saveAuthenticatedCompanySession({ user: login.user, session: login.session }); const identity = await apiRequest('/auth/me'); const memberships = identity.memberships?.filter((membership) => membership.role === 'COMPANY_ADMIN') || []; if (!memberships.length) { clearCompanySession(); throw new Error('adminAccountRequired') }; saveAuthenticatedCompanySession({ ...identity, memberships, session: login.session }); const destination = qrToken ? `/v/${encodeURIComponent(qrToken)}` : '/admin/dashboard'; navigate(memberships.length > 1 ? `/company/select?role=COMPANY_ADMIN&next=${encodeURIComponent(destination)}` : destination) } catch (requestError) { setError(t(requestError.message === 'adminAccountRequired' ? 'adminAccountRequired' : 'loginError')) } finally { setSubmitting(false) } }
  return <div className={styles.page}><Header admin /><main className={styles.main}><form className={styles.card} onSubmit={submit}><div className={styles.icon}>F</div><p className={styles.kicker}>FLEET MANAGEMENT</p><h1>{t('adminLogin')}</h1><label>{t('email')}<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>{t('password')}<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className={styles.error}>{error}</p>}<button type="submit" disabled={submitting}>{t('login')}</button><div className={styles.register}><p>{t('noAccount')}</p><Link to="/company/register">{t('createCompanyAccount')}</Link></div><Link className={styles.back} to="/">{t('backToFleetCheck')}</Link></form></main></div>
}
export default AdminLogin
