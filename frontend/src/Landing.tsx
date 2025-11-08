import { Link } from 'react-router-dom';
import { Heart, Shield, Users } from 'lucide-react';

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full mb-8 shadow-lg">
            <Heart className="w-12 h-12 text-emerald-600 animate-pulse" fill="currentColor" />
          </div>
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent mb-6">
            Salud<span className="text-emerald-600">Hogar</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
            Tu historial médico familiar, siempre al alcance de tus manos
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          <Link 
            to="/login" 
            className="px-10 py-4 bg-white text-emerald-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-300 border-2 border-emerald-200 hover:border-emerald-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 text-lg text-center"
          >
            Iniciar Sesión
          </Link>
          <Link 
            to="/register" 
            className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg text-center"
          >
            Registrarse
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 text-center">
        <p className="text-gray-600 text-sm font-medium">
          © 2025 SaludHogar. Cuidando de tu bienestar desde casa.
        </p>
      </footer>
    </div>
  );
}

export default Landing;