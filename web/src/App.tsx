import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { AuthGuard, GuestGuard } from '@/guards/AuthGuard';
import { LoginPage } from '@/pages/LoginPage';
import { PinLoginPage } from '@/pages/PinLoginPage';
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import { CompanyAdminLayout } from '@/company/layouts/CompanyAdminLayout';
import { EmployeeLayout } from '@/employee/layouts/EmployeeLayout';

/**
 * Role-based redirect component.
 * Dispatches to the appropriate portal based on user role.
 */
function RoleRedirect() {
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? '';

  if (['super_admin', 'platform_staff', 'platform_finance'].includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'company_admin') {
    return <Navigate to="/company" replace />;
  }

  return <Navigate to="/employee" replace />;
}

function AppRoutes() {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/pin" element={<GuestGuard><PinLoginPage /></GuestGuard>} />

      {/* Protected routes */}
      <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>} />
      <Route path="/company" element={<AuthGuard><CompanyAdminLayout /></AuthGuard>} />
      <Route path="/employee" element={<AuthGuard><EmployeeLayout /></AuthGuard>} />

      {/* Fallback — redirect to correct portal based on role */}
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
