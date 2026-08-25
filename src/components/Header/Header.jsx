import { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../Logo/Logo'
import { getCompanyNotifications, markAllCompanyNotificationsRead, markCompanyNotificationRead } from '../../services/companyApiService'
import { clearCompanySession, isCompanyLoggedIn } from '../../services/sessionService'
import styles from './Header.module.css'

const languages = ['de', 'en', 'ru', 'lv']

function Header({ admin = false, allowCompanySignOut = false, role, onAction, actionLabel }) {
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const unread = notifications.filter((item) => !item.is_read).length
  useEffect(() => { if (admin && isCompanyLoggedIn()) getCompanyNotifications().then(setNotifications).catch(() => setNotifications([])) }, [admin])
  const readNotification = async (id) => { await markCompanyNotificationRead(id); setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item)); setShowNotifications(false) }
  const canSignOut = (admin || allowCompanySignOut) && isCompanyLoggedIn()
  const signOut = () => { clearCompanySession(); navigate('/') }
  const action = canSignOut ? signOut : onAction
  const label = canSignOut ? 'signOut' : actionLabel
  const markAllRead = async () => { await markAllCompanyNotificationsRead(); setNotifications((current) => current.map((item) => ({ ...item, is_read: true }))); setShowNotifications(false) }
  const logoTarget = isCompanyLoggedIn() ? '/company/home' : '/'
  return <header className={`${styles.header} ${admin ? styles.admin : ''}`}><Link className={styles.brand} to={logoTarget} aria-label={t('fleetCheck')}><Logo variant="compact" /></Link><div className={styles.controls}>{role && <span className={styles.role}>{t(role)}</span>}{admin && isCompanyLoggedIn() && <div className={styles.notificationWrap}><button className={styles.bell} type="button" onClick={() => setShowNotifications((open) => !open)} aria-label={t('notifications')}>◉{unread > 0 && <b>{unread}</b>}</button>{showNotifications && <section className={styles.notifications}><button type="button" onClick={markAllRead}>{t('markAllRead')}</button>{notifications.length === 0 ? <p>{t('noNotifications')}</p> : notifications.map((item) => <button className={item.is_read ? styles.read : ''} type="button" key={item.id} onClick={() => readNotification(item.id)}>{item.title}<small>{item.message}</small></button>)}</section>}</div>}<nav className={styles.languages} aria-label="Language selector">{languages.map((code) => <button key={code} className={language === code ? styles.active : ''} onClick={() => setLanguage(code)} type="button">{code.toUpperCase()}</button>)}</nav>{action && <button className={styles.action} type="button" onClick={action}>{t(label)}</button>}</div></header>
}

export default Header
