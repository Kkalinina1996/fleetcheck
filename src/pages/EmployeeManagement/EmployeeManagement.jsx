import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext'
import { getCompanyEmployees, inviteCompanyEmployee, removeCompanyEmployee } from '../../services/employeeApiService'
import { isCompanyAdmin } from '../../services/sessionService'
import styles from './EmployeeManagement.module.css'

function EmployeeManagement() {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ fullName: '', email: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const load = () => getCompanyEmployees().then(setEmployees).catch(() => setEmployees([]))
  useEffect(() => { if (isCompanyAdmin()) load() }, [])
  if (!isCompanyAdmin()) return <Navigate to="/company/driver" replace />
  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const employee = await inviteCompanyEmployee(form)
      setEmployees((current) => [...current, employee])
      setForm({ fullName: '', email: '' })
    } catch (requestError) {
      const key = requestError.message === 'This employee already has access to the company' ? 'employeeAlreadyAssigned' : 'employeeInviteFailed'
      setError(t(key))
    } finally {
      setSubmitting(false)
    }
  }
  const remove = async (userId) => {
    await removeCompanyEmployee(userId)
    setEmployees((current) => current.filter((employee) => employee.userId !== userId))
  }
  return <div className={styles.page}><Header admin /><main className={styles.main}><Link className={styles.back} to="/admin/dashboard">← {t('backToDashboard')}</Link><section className={styles.card}><p>{t('companyAdminRole')}</p><h1>{t('employees')}</h1><form className={styles.form} onSubmit={submit}><label>{t('employeeName')}<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label><label>{t('email')}<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>{error && <p className={styles.error}>{error}</p>}<button type="submit" disabled={submitting}>{t('inviteEmployee')}</button></form><div className={styles.list}>{employees.length === 0 ? <p>{t('noEmployees')}</p> : employees.map((employee) => <article key={employee.userId}><div><strong>{employee.fullName || employee.email}</strong><span>{employee.email}</span></div><button type="button" onClick={() => remove(employee.userId)}>{t('removeEmployee')}</button></article>)}</div></section></main></div>
}

export default EmployeeManagement
