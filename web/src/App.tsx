import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { AuthGuard, GuestGuard } from '@/guards/AuthGuard';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from '@/admin/layouts/AdminLayout';

function AppRoutes() {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
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
