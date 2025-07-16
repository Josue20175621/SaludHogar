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
  { id: 'dashboard', label: 'Dashboard', path: '/app', icon: Home },
  { id: 'members', label: 'Family Members', path: '/app/members', icon: Users },
  { id: 'appointments', label: 'Appointments', path: '/app/appointments', icon: Calendar },
  { id: 'medications', label: 'Medications', path: '/app/medications', icon: Pill },
  { id: 'vaccinations', label: 'Vaccinations', path: '/app/vaccinations', icon: Shield },
  { id: 'profile', label: 'Profile', path: '/app/profile', icon: User },
  { id: 'settings', label: 'Settings', path: '/app/settings', icon: Settings }
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
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${isActive ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'} whitespace-nowrap`}
              >
                <Icon className="w-5 h-5" />
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