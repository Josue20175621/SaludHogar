import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Users, Calendar, Pill, Shield, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoutButton from './LogoutButton';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  isCustom?: boolean;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Resumen', path: '/app', icon: Home },
  { id: 'members', label: 'Miembros', path: '/app/members', icon: Users },
  { id: 'notifications', label: 'Notificaciones', path: '/app/notifications', icon: NotificationBell, isCustom: true },
  { id: 'appointments', label: 'Citas medicas', path: '/app/appointments', icon: Calendar },
  { id: 'medications', label: 'Medicamentos', path: '/app/medications', icon: Pill },
  { id: 'vaccinations', label: 'Vacunas', path: '/app/vaccinations', icon: Shield }
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { activeFamily } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-transparent backdrop-blur-md px-4 py-3">
        <nav className="flex items-center gap-2 overflow-x-auto p-0.5">
          
          {/* Logo */}
          <Link
            to="/app"
            className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100 text-gray-700"
          >
            <Shield className="w-6 h-6 text-cyan-600" />
            <span className="font-bold">SaludHogar</span>
          </Link>

          {/* Nav */}
          {navigationItems.map(item => {
            const Icon = item.icon;
            let isActive = item.path === '/app'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            const baseClasses =
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-medium whitespace-nowrap transition-colors";


            const activeClasses = "bg-cyan-50 text-cyan-700 font-semibold";
            const inactiveClasses = "text-gray-600 hover:bg-cyan-100";

            if (item.isCustom) {
              const CustomIcon = Icon as React.ComponentType<any>;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                >
                  <CustomIcon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          <div className="flex-grow"></div>

          {activeFamily?.name && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700">
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold">
                  {activeFamily.name}
                </span>
              </div>
            </div>
          )}
          <LogoutButton />
        </nav>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
};

export default Layout;
