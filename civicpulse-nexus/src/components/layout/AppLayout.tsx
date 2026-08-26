import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';

export function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Route guards — citizens cannot access /admin/*, admins cannot access /citizen/*
  const isCitizenRoute = location.pathname.startsWith('/citizen');
  const isAdminRoute   = location.pathname.startsWith('/admin');

  if (isCitizenRoute && user?.role !== 'citizen') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (isAdminRoute && user?.role === 'citizen') {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
