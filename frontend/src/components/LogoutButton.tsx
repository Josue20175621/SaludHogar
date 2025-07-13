import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LogoutButton: FC = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

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
      className="flex items-center gap-2 px-4 py-2 text-white/80 font-medium hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
      aria-label="Cerrar Sesión"
    >
      <LogOut className="w-5 h-5" />
      <span>Cerrar Sesión</span>
    </button>
  );
};

export default LogoutButton;
