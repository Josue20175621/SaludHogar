import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
              <Route path="/dashboard" element={<App />}>
                {/* Child routes. These will render inside App's <Outlet /> */}
                <Route index element={<Dashboard />} /> {/* /dashboard */}
                <Route path="members" element={<FamilyMembers />} /> {/* /dashboard/members */}
                <Route path="appointments" element={<Appointments />} /> {/* /dashboard/appointments */}
                <Route path="medications" element={<Medications />} /> {/* /dashboard/medications */}
                <Route path="vaccinations" element={<Vaccinations />} /> {/* /dashboard/vaccinations */}
                {/* <Route path="profile" element={<ProfilePage />} /> */}
                {/* <Route path="settings" element={<SettingsPage />} /> */}
              </Route>
              {/* <Route path="/settings/mfa" element={<TwoFactorSetup />} /> */}
              {/* Add other top-level private routes here */}
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);