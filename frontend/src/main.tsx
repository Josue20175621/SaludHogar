import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
// import TwoFactorSetup from './components/auth/TwoFactorSetup';
import './index.css';

import Landing from './Landing'
import App from './App';
import Dashboard from './pages/dashboard/Dashboard';
import FamilyMembers from './pages/family/FamilyMembers';
import Appointments from './pages/appointments/Appointments';
import Medications from './pages/medications/Medications';
import Vaccinations from './pages/vaccinations/Vaccinations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh. During this time, data is served
      // from the cache without a background refetch.
      staleTime: 1000 * 60 * 5, // 5 minutes

      // How long inactive data is kept in the cache before being garbage collected.
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchOnWindowFocus: false, 
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* public */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              <Route path="/" element={<Landing />} />

              {/* --- PROTECTED ROUTES --- */}
              <Route element={<ProtectedRoute />}>
                {/* The parent route for the entire health tracker */}
                <Route path="/app" element={<App />}>
                  {/* Child routes. These will render inside App's <Outlet /> */}
                  <Route index element={<Dashboard />} /> {/* /app */}
                  <Route path="members" element={<FamilyMembers />} /> {/* /app/members */}
                  {/* <Route path="members/:memberId" element={<MemberDetail />} /> */}

                  <Route path="appointments" element={<Appointments />} /> {/* /app/appointments */}
                  <Route path="medications" element={<Medications />} /> {/* /app/medications */}
                  <Route path="vaccinations" element={<Vaccinations />} /> {/* /app/vaccinations */}

                  {/* <Route path="profile" element={<ProfilePage />} /> */}
                  {/* <Route path="settings" element={<SettingsPage />} /> /app/settings */}
                  {/* <Route path="settings/mfa" element={<TwoFactorSetup />} /> /app/settings/mfa */}
                </Route>
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);