import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { apiRequest } from '../../services/apiClient'
import { clearCompanySession, getCompanyMemberships, hasCompanyAuthentication, isCompanyEmployee, saveAuthenticatedCompanySession } from '../../services/sessionService'
import styles from './DriverLogin.module.css'

function DriverLogin() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qrToken = searchParams.get('qr')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const destination = qrToken ? `/v/${encodeURIComponent(qrToken)}` : '/company/driver'

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const login = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      saveAuthenticatedCompanySession({ user: login.user, session: login.session })
      const identity = await apiRequest('/auth/me')
      const memberships = identity.memberships?.filter((membership) => membership.role === 'EMPLOYEE') || []
      if (!memberships.length) {
        clearCompanySession()
        throw new Error('employeeAccountRequired')
      }
      saveAuthenticatedCompanySession({ ...identity, memberships, session: login.session })
      navigate(memberships.length > 1 ? `/company/select?role=EMPLOYEE&next=${encodeURIComponent(destination)}` : destination)
    } catch (requestError) {
      setError(t(requestError.message === 'employeeAccountRequired' ? 'employeeAccountRequired' : 'loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isCompanyEmployee()) return <Navigate to={destination} replace />
  if (hasCompanyAuthentication() && getCompanyMemberships().some((membership) => membership.role === 'EMPLOYEE')) return <Navigate to={`/company/select?role=EMPLOYEE&next=${encodeURIComponent(destination)}`} replace />
  return <div className={styles.page}><Header /><main className={styles.main}><form className={styles.card} onSubmit={submit}><p>{t('employeeRole')}</p><h1>{t('driverSignIn')}</h1><label>{t('email')}<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>{t('password')}<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className={styles.error} role="alert">{error}</p>}<button type="submit" disabled={submitting}>{t('signIn')}</button><Link to="/company">{t('back')}</Link></form></main></div>
}

export default DriverLogin
