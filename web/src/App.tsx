import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { AuthGuard, GuestGuard } from '@/guards/AuthGuard';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import { EmployeeLayout } from '@/employee/layouts/EmployeeLayout';

/**
 * Role-based redirect component.
 * super_admin / company_admin → /admin
 * employee (or any other role) → /employee
 */
function RoleRedirect() {
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? '';

  if (role === 'super_admin' || role === 'company_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/employee" replace />;
}

function AppRoutes() {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>} />
      <Route path="/employee" element={<AuthGuard><EmployeeLayout /></AuthGuard>} />
      <Route path="*" element={<AuthGuard><RoleRedirect /></AuthGuard>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
