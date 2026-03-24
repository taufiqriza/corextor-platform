import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { AuthGuard, GuestGuard, PLATFORM_ROLES } from '@/guards/AuthGuard';
import { LoginPage } from '@/pages/LoginPage';
import { PinLoginPage } from '@/pages/PinLoginPage';
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import { CompanyAdminLayout } from '@/company/layouts/CompanyAdminLayout';
import { EmployeeLayout } from '@/employee/layouts/EmployeeLayout';

function AppRoutes() {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/pin" element={<GuestGuard><PinLoginPage /></GuestGuard>} />

      {/* Protected routes — strict role isolation */}
      <Route path="/admin" element={
        <AuthGuard allowedRoles={[...PLATFORM_ROLES]}>
          <AdminLayout />
        </AuthGuard>
      } />
      <Route path="/company" element={
        <AuthGuard allowedRoles={['company_admin']}>
          <CompanyAdminLayout />
        </AuthGuard>
      } />
      <Route path="/employee" element={
        <AuthGuard allowedRoles={['employee']}>
          <EmployeeLayout />
        </AuthGuard>
      } />

      {/* Fallback — AuthGuard without allowedRoles will redirect to correct portal */}
      <Route path="*" element={
        <AuthGuard>
          <div />
        </AuthGuard>
      } />
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
