import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
    const navigate = useNavigate();

    const goToMFA = () => {
        navigate('/mfa');
    };

    return (
        <div className="p-6">
            {/* Header identical to other pages */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Configuración</h2>
            </div>

            {/* Content */}
            <div className="mt-8">
                <button
                    onClick={goToMFA}
                    className="
                        flex items-center gap-2 
                        px-4 py-2.5 
                        rounded-xl 
                        text-base font-medium 
                        whitespace-nowrap 
                        transition-colors 
                        bg-cyan-50 text-cyan-700 font-semibold
                        hover:bg-cyan-100
                    "
                >
                    Habilitar autenticación de dos factores
                </button>
            </div>
        </div>
    );
};

export default Settings;
