import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LogoutButton: FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
      alert('Could not log out, please try again.');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 text-gray-700 font-medium cursor-pointer rounded-xl hover:text-cyan-700 hover:bg-cyan-50 transition-all duration-200"
      aria-label="Cerrar Sesión"
    >
      <LogOut className="w-4 h-4" />
      <span>Cerrar Sesión</span>
    </button>

  );
};

export default LogoutButton;
