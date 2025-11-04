import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Notification({ message, type, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger the fade-in animation shortly after the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small delay to ensure the initial state is rendered first

    return () => clearTimeout(timer);
  }, []);
  
  // This function will start the fade-out animation
  const handleClose = () => {
    setIsVisible(false);
    // Wait for the animation to finish before calling the parent's onClose
    setTimeout(() => {
      onClose();
    }, 300); // This duration should match the transition duration
  };

  const isSuccess = type === 'success';

  const containerClasses = `
    fixed top-5 left-1/2 w-full max-w-sm p-4 rounded-lg shadow-lg flex items-start gap-4 z-50
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
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Notification;