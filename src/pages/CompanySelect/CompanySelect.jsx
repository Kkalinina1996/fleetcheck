import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyMemberships, hasCompanyAuthentication, selectActiveCompany } from '../../services/sessionService'
import styles from './CompanySelect.module.css'

function CompanySelect() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requiredRole = searchParams.get('role')
  const next = searchParams.get('next') || '/company/home'
  const memberships = getCompanyMemberships().filter((membership) => !requiredRole || membership.role === requiredRole)
  const choose = (membership) => {
    if (selectActiveCompany(membership.companyId)) navigate(next, { replace: true })
  }
  if (!hasCompanyAuthentication()) return <Navigate to="/admin" replace />
  return <div className={styles.page}><Header /><main className={styles.main}><section className={styles.card}><p>{t('selectCompanyHint')}</p><h1>{t('selectCompany')}</h1><div className={styles.list}>{memberships.map((membership) => <button type="button" key={membership.companyId} onClick={() => choose(membership)}><strong>{membership.company?.name}</strong><span>{t(membership.role === 'EMPLOYEE' ? 'employeeRole' : 'companyAdminRole')}</span></button>)}</div></section></main></div>
}

export default CompanySelect
