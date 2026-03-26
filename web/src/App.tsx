import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { AuthGuard, GuestGuard, PLATFORM_ROLES } from '@/guards/AuthGuard';
import { LoginPage } from '@/pages/LoginPage';
import { PinLoginPage } from '@/pages/PinLoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { RedirectByAuthPage } from '@/pages/RedirectByAuthPage';
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import { CompanyAdminLayout } from '@/company/layouts/CompanyAdminLayout';
import { EmployeeLayout } from '@/employee/layouts/EmployeeLayout';
import { getHomeDestination, getLoginDestination, hasDedicatedEmployeeSurface, isEmployeeSurface } from '@/lib/appSurface';

function AppRoutes() {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  const employeeSurface = isEmployeeSurface();
  const dedicatedEmployeeSurface = hasDedicatedEmployeeSurface();

  if (employeeSurface) {
    return (
      <Routes>
        <Route path="/" element={<GuestGuard><PinLoginPage /></GuestGuard>} />
        <Route path="/pin" element={<Navigate to="/" replace />} />
        <Route path="/employee" element={
          <AuthGuard allowedRoles={['employee']}>
            <EmployeeLayout />
          </AuthGuard>
        } />
        <Route path="*" element={<RedirectByAuthPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Guest routes */}
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route
        path="/pin"
        element={dedicatedEmployeeSurface
          ? <CrossOriginRedirect to={getLoginDestination('employee')} />
          : <GuestGuard><PinLoginPage /></GuestGuard>}
      />

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
      <Route
        path="/employee"
        element={dedicatedEmployeeSurface
          ? <CrossOriginRedirect to={getHomeDestination('employee')} />
          : (
            <AuthGuard allowedRoles={['employee']}>
              <EmployeeLayout />
            </AuthGuard>
          )}
      />

      <Route path="*" element={<RedirectByAuthPage />} />
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

function CrossOriginRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}
