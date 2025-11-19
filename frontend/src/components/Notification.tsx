import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  closing: boolean;
  onClose: () => void;
  onRequestClose: () => void;
}

function Notification({ message, type, closing, onClose, onRequestClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 20);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (closing) {
      setIsVisible(false);
      const timer = setTimeout(() => onClose(), 300);
      return () => clearTimeout(timer);
    }
  }, [closing, onClose]);

  const isSuccess = type === 'success';

  const containerClasses = `
    fixed top-5 left-1/2 w-full max-w-sm p-4 rounded-lg shadow-lg flex items-start gap-4 z-[100]
    transition-all duration-300 ease-in-out transform -translate-x-1/2
    ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}
  `;

  return (
    <div className={containerClasses}>
      <div className="flex-shrink-0">
        {isSuccess ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-500" />
        )}
      </div>

      <div className="flex-1">
        <p className="font-medium">{isSuccess ? 'Éxito' : 'Error'}</p>
        <p className="text-sm font-semibold">{message}</p>
      </div>

      <button
        onClick={onRequestClose}
        className="text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Notification;