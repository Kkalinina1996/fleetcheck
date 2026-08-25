import { useLanguage } from '../../context/LanguageContext'
import { Link } from 'react-router-dom'
import Logo from '../Logo/Logo'
import styles from './Header.module.css'

const languages = ['de', 'en', 'ru', 'lv']

function Header({ admin = false, role, onAction, actionLabel }) {
  const { language, setLanguage, t } = useLanguage()
  return <header className={`${styles.header} ${admin ? styles.admin : ''}`}><Link className={styles.brand} to="/" aria-label={t('fleetCheck')}><Logo variant="compact" /></Link><div className={styles.controls}>{role && <span className={styles.role}>{t(role)}</span>}<nav className={styles.languages} aria-label="Language selector">{languages.map((code) => <button key={code} className={language === code ? styles.active : ''} onClick={() => setLanguage(code)} type="button">{code.toUpperCase()}</button>)}</nav>{onAction && <button className={styles.action} type="button" onClick={onAction}>{t(actionLabel)}</button>}</div></header>
}

export default Header
