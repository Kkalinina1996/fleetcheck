import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { resolveQrAccessToken, validateQrAccessToken } from '../../services/qrAccessService'
import { isCompanyLoggedIn, isPrivateLoggedIn } from '../../services/sessionService'
import styles from './PublicVehicleAccess.module.css'

function PublicVehicleAccess() {
  const { token } = useParams()
  const { t } = useLanguage()
  const [state, setState] = useState('loading')
  const [destination, setDestination] = useState('')

  useEffect(() => {
    let active = true
    const openAccess = async () => {
      try {
        await validateQrAccessToken(token)
        if (!active) return
        if (!isCompanyLoggedIn() && !isPrivateLoggedIn()) {
          setState('signIn')
          return
        }
        const access = await resolveQrAccessToken(token)
        if (!active) return
        setDestination(access.access === 'COMPANY'
          ? `/company/check/${access.vehicleId}`
          : `/home/private/vehicle/${access.vehicleId}/history`)
      } catch {
        if (active) setState('notFound')
      }
    }
    openAccess()
    return () => { active = false }
  }, [token])

  if (destination) return <Navigate to={destination} replace />

  return <div className={styles.page}>
    <Header />
    <main className={styles.main}>
      <section className={styles.card} aria-live="polite">
        {state === 'loading' && <><span className={styles.spinner} aria-hidden="true" /><h1>{t('loading')}</h1></>}
        {state === 'notFound' && <><span className={styles.icon} aria-hidden="true">!</span><h1>{t('vehicleAccessNotFound')}</h1><p>{t('vehicleAccessNotFoundHint')}</p><Link className={styles.secondary} to="/">{t('backToFleetCheck')}</Link></>}
        {state === 'signIn' && <><span className={styles.icon} aria-hidden="true">✓</span><h1>{t('vehicleAccessReady')}</h1><p>{t('vehicleAccessSignInHint')}</p><div className={styles.actions}><Link to={`/private/auth?qr=${encodeURIComponent(token)}`}>{t('privateSignIn')}</Link><Link className={styles.secondary} to={`/admin?qr=${encodeURIComponent(token)}`}>{t('companySignIn')}</Link></div></>}
      </section>
    </main>
  </div>
}

export default PublicVehicleAccess
