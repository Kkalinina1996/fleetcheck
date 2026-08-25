import styles from './Logo.module.css'
import logoImage from '../../assets/fleetcheck-logo.png'

function Logo({ variant = 'full', light = false }) {
  const className = `${styles.logo} ${styles[variant]} ${light ? styles.light : ''}`
  return <div className={className}><img src={logoImage} alt="FleetCheck" /></div>
}

export default Logo
