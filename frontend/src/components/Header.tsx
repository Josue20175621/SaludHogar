import React from "react";
import { useAuth } from '../context/AuthContext';
import LogoutButton from "./LogoutButton";
import { Shield } from "lucide-react";

const Header: React.FC = () => {
  const { activeFamily } = useAuth();

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8" />
          <h1 className="text-xl font-bold">SaludHogar</h1>
        </div>
        <div className="text-sm opacity-90">
          Welcome back, {activeFamily?.name}
        </div>
        <div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default Header;