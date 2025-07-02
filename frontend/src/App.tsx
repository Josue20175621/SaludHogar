import { Link } from 'react-router-dom';
import { Heart, Shield, Users } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="absolute top-0 right-0 p-6 z-10">
        <div className="flex gap-4">
          <Link 
            to="/login" 
            className="px-6 py-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors duration-200"
          >
            Iniciar Sesión
          </Link>
          <Link 
            to="/register" 
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors duration-200 shadow-sm"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <Heart className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-4">
            Salud<span className="text-emerald-600">Hogar</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Tu bienestar y el de tu familia, siempre al alcance de tus manos
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
              <Heart className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cuidado Personalizado</h3>
            <p className="text-gray-600 text-sm">Servicios de salud adaptados a las necesidades de tu hogar</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-lg mb-4">
              <Shield className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Seguro y Confiable</h3>
            <p className="text-gray-600 text-sm">Servicios de calidad garantizada</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Para Toda la Familia</h3>
            <p className="text-gray-600 text-sm">Servicios integrales para cada miembro de tu familia</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/register" 
            className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Comenzar Ahora
          </Link>
          <Link 
            to="/login" 
            className="px-8 py-3 bg-white text-emerald-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200 border border-emerald-200"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center">
        <p className="text-gray-500 text-sm">
          © 2025 SaludHogar. Cuidando de tu bienestar desde casa.
        </p>
      </footer>
    </div>
  );
}

export default App;