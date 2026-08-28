import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import AdminLogin from './pages/AdminLogin/AdminLogin'
import AdminVehicle from './pages/AdminVehicle/AdminVehicle'
import DriverCheckIn from './pages/DriverCheckIn/DriverCheckIn'
import DriverManualEntry from './pages/DriverManualEntry/DriverManualEntry'
import KnownIssues from './pages/KnownIssues/KnownIssues'
import CompanyHome from './pages/CompanyHome/CompanyHome'
import CompanyEntry from './pages/CompanyEntry/CompanyEntry'
import CompanyRegister from './pages/CompanyRegister/CompanyRegister'
import CompanySetup from './pages/CompanySetup/CompanySetup'
import CompanyVehicleCheck from './pages/CompanyVehicleCheck/CompanyVehicleCheck'
import CompanyVehicles from './pages/CompanyVehicles/CompanyVehicles'
import CompanyReportIssue from './pages/CompanyReportIssue/CompanyReportIssue'
import CompanyReports from './pages/CompanyReports/CompanyReports'
import PrivateReportIssue from './pages/PrivateReportIssue/PrivateReportIssue'
import PrivateHome from './pages/PrivateHome/PrivateHome'
import PrivateHistory from './pages/PrivateHistory/PrivateHistory'
import PrivateVehicleOk from './pages/PrivateVehicleOk/PrivateVehicleOk'
import PrivateAuth from './pages/PrivateAuth/PrivateAuth'
import Calendar from './pages/Calendar/Calendar'
import ReportIssue from './pages/ReportIssue/ReportIssue'
import VehicleCheck from './pages/VehicleCheck/VehicleCheck'
import Welcome from './pages/Welcome/Welcome'
import { restoreCompanySession, restorePrivateSession } from './services/sessionService'

function HomeRoute() {
  const [searchParams] = useSearchParams()
  return searchParams.get('mode') === 'private' ? <PrivateHome /> : <Navigate to="/company/check" replace />
}

function App() {
  const [, setAuthVersion] = useState(0)
  useEffect(() => { Promise.all([restoreCompanySession(), restorePrivateSession()]); const onAuthExpired = () => setAuthVersion((version) => version + 1); window.addEventListener('fleetcheck-auth-expired', onAuthExpired); return () => window.removeEventListener('fleetcheck-auth-expired', onAuthExpired) }, [])
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/vehicle/:vehicleId" element={<DriverCheckIn />} />
          <Route path="/home" element={<HomeRoute />} />
          <Route path="/private/auth" element={<PrivateAuth />} />
          <Route path="/private/register" element={<PrivateAuth register />} />
          <Route path="/private/calendar" element={<Calendar mode="private" />} />
          <Route path="/company/calendar" element={<Calendar mode="company" />} />
          <Route path="/company" element={<CompanyEntry />} />
          <Route path="/company/check" element={<DriverManualEntry />} />
          <Route path="/company/check/:vehicleId" element={<CompanyVehicleCheck />} />
          <Route path="/company/check/:vehicleId/report" element={<CompanyReportIssue />} />
          <Route path="/company/register" element={<CompanyRegister />} />
          <Route path="/company/setup" element={<CompanySetup />} />
          <Route path="/company/home" element={<CompanyHome />} />
          <Route path="/company/vehicles" element={<CompanyVehicles />} />
          <Route path="/company/reports" element={<CompanyReports />} />
          <Route path="/driver" element={<Navigate to="/home" replace />} />
          <Route path="/vehicle/:vehicleId/check" element={<VehicleCheck />} />
          <Route path="/vehicle/:vehicleId/report" element={<ReportIssue />} />
          <Route path="/home/private/vehicle/:vehicleId/report" element={<PrivateReportIssue />} />
          <Route path="/home/private/vehicle/:vehicleId/ok" element={<PrivateVehicleOk />} />
          <Route path="/home/private/vehicle/:vehicleId/history" element={<PrivateHistory />} />
          <Route path="/vehicle/:vehicleId/issues" element={<KnownIssues />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/vehicle/:vehicleId" element={<AdminVehicle />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
