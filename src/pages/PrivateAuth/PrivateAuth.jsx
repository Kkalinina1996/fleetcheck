import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { apiRequest } from '../../services/apiClient'
import { clearPrivateSession, isPrivateLoggedIn, saveAuthenticatedPrivateSession } from '../../services/sessionService'
import styles from './PrivateAuth.module.css'

const authErrorKeys = {
  'Name is required': 'privateNameRequired',
  'A valid email address is required': 'privateEmailInvalid',
  'Password must be at least 8 characters': 'privatePasswordLength',
  'Unable to create private account': 'privateRegistrationFailed',
  'Invalid email or password': 'privateLoginFailed',
  privateAccountRequired: 'privateAccountRequired',
  serverConnectionFailed: 'serverConnectionFailed',
}

function PrivateAuth({ register = false }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (register && form.password !== form.confirmPassword) return setError(t('passwordsDoNotMatch'))
    setSubmitting(true); setError('')
    try {
      if (register) await apiRequest('/auth/register-private', { method: 'POST', body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password }) })
      const login = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) })
      saveAuthenticatedPrivateSession({ user: login.user, session: login.session })
      const identity = await apiRequest('/auth/me')
      if (identity.company) {
        clearPrivateSession()
        throw new Error('privateAccountRequired')
      }
      saveAuthenticatedPrivateSession({ ...identity, session: login.session })
      navigate('/home?mode=private')
    } catch (requestError) { setError(t(authErrorKeys[requestError.message] || 'privateAuthenticationFailed')) } finally { setSubmitting(false) }
  }
  if (isPrivateLoggedIn()) return <Navigate to="/home?mode=private" replace />
  return <div className={styles.page}><Header /><main className={styles.main}><form className={styles.card} onSubmit={submit}><p className={styles.kicker}>{t('privateRole')}</p><h1>{t(register ? 'createPrivateAccount' : 'privateSignIn')}</h1>{register && <label>{t('yourName')}<input required value={form.fullName} onChange={(event) => update('fullName', event.target.value)} autoComplete="name" /></label>}<label>{t('email')}<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></label><label>{t('password')}<input required minLength="8" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} /></label>{register && <label>{t('confirmPassword')}<input required minLength="8" type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} autoComplete="new-password" /></label>}{error && <p className={styles.error} role="alert">{error}</p>}<button type="submit" disabled={submitting}>{t(register ? 'createAccount' : 'signIn')}</button><Link to={register ? '/private/auth' : '/private/register'}>{t(register ? 'alreadyHaveAccount' : 'createPrivateAccount')}</Link><Link className={styles.back} to="/">{t('backToFleetCheck')}</Link></form></main></div>
}

export default PrivateAuth
