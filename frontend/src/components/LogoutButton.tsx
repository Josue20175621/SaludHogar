// components/LogoutButton.tsx
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';         // or the icon lib you use
import { useAuth } from '../context/AuthContext';

interface Props {
  isSidebarOpen: boolean;                      // controls label visibility
}

const LogoutButton: FC<Props> = ({ isSidebarOpen }) => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleClick = async () => {
    try {
      await logout();                         // backend call + state reset
      navigate('/login');
    } catch (e) {
      console.error(e);
      alert('Could not log out, please try again.');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <LogOut className="w-5 h-5" />
      {isSidebarOpen && <span>Cerrar Sesión</span>}
    </button>
  );
};

export default LogoutButton;
