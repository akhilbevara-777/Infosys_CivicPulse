import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CitizensPage from './pages/admin/CitizensPage';
import GrievancesPage from './pages/admin/GrievancesPage';
import ServicesPage from './pages/admin/ServicesPage';
import ApplicationsPage from './pages/admin/ApplicationsPage';
import ReportsPage from './pages/admin/ReportsPage';
import WelfarePage from './pages/admin/WelfarePage';
import BudgetPage from './pages/admin/BudgetPage';
import AssetsPage from './pages/admin/AssetsPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import CitizenGrievancesPage from './pages/citizen/CitizenGrievancesPage';
import CitizenServicesPage from './pages/citizen/CitizenServicesPage';
import CitizenApplicationsPage from './pages/citizen/CitizenApplicationsPage';
import CitizenWelfarePage from './pages/citizen/CitizenWelfarePage';
import NotificationsPage from './pages/citizen/NotificationsPage';
import CitizenProfilePage from './pages/citizen/CitizenProfilePage';
import { useAuthStore } from './store/authStore';

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#14b8a6', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin / Officer / Commissioner */}
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/citizens" element={<CitizensPage />} />
          <Route path="/admin/grievances" element={<GrievancesPage />} />
          <Route path="/admin/services" element={<ServicesPage />} />
          <Route path="/admin/applications" element={<ApplicationsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/welfare" element={<WelfarePage />} />
          <Route path="/admin/budget" element={<BudgetPage />} />
          <Route path="/admin/assets" element={<AssetsPage />} />
        </Route>

        {/* Citizen */}
        <Route element={<AppLayout />}>
          <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
          <Route path="/citizen/grievances"    element={<CitizenGrievancesPage />} />
          <Route path="/citizen/services"      element={<CitizenServicesPage />} />
          <Route path="/citizen/applications"  element={<CitizenApplicationsPage />} />
          <Route path="/citizen/welfare"       element={<CitizenWelfarePage />} />
          <Route path="/citizen/notifications" element={<NotificationsPage />} />
          <Route path="/citizen/profile"       element={<CitizenProfilePage />} />
        </Route>

        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
