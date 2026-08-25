import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../Logo/Logo'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService'
import { clearCompanySession, isAdminLoggedIn, isCompanyLoggedIn, logoutAdmin } from '../../services/sessionService'
import { getCompanySession } from '../../services/sessionService'
import styles from './Header.module.css'

const languages = ['de', 'en', 'ru', 'lv']

function Header({ admin = false, allowCompanySignOut = false, role, onAction, actionLabel }) {
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const companyId = getCompanySession()?.companyId || getCompanySession()?.id
  const notifications = admin ? getNotifications().filter((item) => !companyId || item.companyId === companyId) : []
  const unread = notifications.filter((item) => !item.read).length
  const readNotification = (id) => { markNotificationRead(id); setShowNotifications(false) }
  const canSignOut = (admin && (isAdminLoggedIn() || isCompanyLoggedIn())) || (allowCompanySignOut && isCompanyLoggedIn())
  const signOut = () => { if (admin && isAdminLoggedIn()) logoutAdmin(); else clearCompanySession(); navigate('/') }
  const action = canSignOut ? signOut : onAction
  const label = canSignOut ? 'signOut' : actionLabel
  return <header className={`${styles.header} ${admin ? styles.admin : ''}`}><Link className={styles.brand} to="/" aria-label={t('fleetCheck')}><Logo variant="compact" /></Link><div className={styles.controls}>{role && <span className={styles.role}>{t(role)}</span>}{admin && <div className={styles.notificationWrap}><button className={styles.bell} type="button" onClick={() => setShowNotifications((open) => !open)} aria-label={t('notifications')}>◉{unread > 0 && <b>{unread}</b>}</button>{showNotifications && <section className={styles.notifications}><button type="button" onClick={() => { markAllNotificationsRead(); setShowNotifications(false) }}>{t('markAllRead')}</button>{notifications.length === 0 ? <p>{t('noNotifications')}</p> : notifications.map((item) => <button className={item.read ? styles.read : ''} type="button" key={item.id} onClick={() => readNotification(item.id)}>{item.plateNumber} · {t(item.issueType)}<small>{item.employeeName}</small></button>)}</section>}</div>}<nav className={styles.languages} aria-label="Language selector">{languages.map((code) => <button key={code} className={language === code ? styles.active : ''} onClick={() => setLanguage(code)} type="button">{code.toUpperCase()}</button>)}</nav>{action && <button className={styles.action} type="button" onClick={action}>{t(label)}</button>}</div></header>
}

export default Header
