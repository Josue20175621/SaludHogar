import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import type {LucideIcon} from 'lucide-react'
import { Users, Calendar, Pill, Shield, Home, User, Settings } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Resumen', path: '/app', icon: Home },
  { id: 'members', label: 'Miembros', path: '/app/members', icon: Users },
  { id: 'vaccinations', label: 'Vacunas', path: '/app/vaccinations', icon: Shield },
  // { id: 'appointments', label: 'Citas medicas', path: '/app/appointments', icon: Calendar },
  { id: 'medications', label: 'Medicamentos', path: '/app/medications', icon: Pill },
  // { id: 'profile', label: 'Profile', path: '/app/profile', icon: User },
  // { id: 'settings', label: 'Settings', path: '/app/settings', icon: Settings }
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <nav className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            let isActive = false;
            if (item.path === '/app') {
              // The dashboard tab is only active if the path is an EXACT match.
              isActive = location.pathname === item.path;
            } else {
              // All other tabs are active if the current URL starts with their path.
              isActive = location.pathname.startsWith(item.path);
            }
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors duration-200 whitespace-nowrap
                  ${isActive 
                    ? 'text-cyan-600 border-b-2 border-cyan-600' 
                    : 'text-gray-500 hover:text-cyan-600 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-cyan-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;