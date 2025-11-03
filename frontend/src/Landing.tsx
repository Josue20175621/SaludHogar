import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

function Landing() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">

      {/* Bottom glowing color field */}
      <div className="absolute inset-x-0 bottom-0 h-[60vh] pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[55vw] h-[55vh] bg-purple-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55vw] h-[55vh] bg-cyan-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-[55vw] h-[55vh] bg-emerald-200 rounded-full blur-[120px] opacity-40"></div>
      </div>

      {/* White fade overlay to blend into top */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white/95 to-transparent"></div>

      {/* Soft readability veil (very subtle now) */}
      <div className="absolute inset-0 bg-white/10"></div>

      {/* Top nav */}
      <header className="relative z-10 flex flex-col items-center gap-4 pt-10 px-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-gray-700" />
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-cyan-600">Salud</span>
            <span className="text-emerald-600">Hogar</span>
          </h1>

        </div>
      </header>

      {/* Hero text */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center min-h-[70vh] px-4">
        <h3 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
          Tu historial médico familiar
          <div>siempre al alcance de tus manos.</div>
        </h3>

        <div className="flex gap-4 mt-6">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-lg text-white font-medium text-lg
                       bg-cyan-600
                       hover:bg-cyan-700
                       transition-all duration-200 shadow-sm"
          >
            Iniciar sesión
          </Link>

          <Link
            to="/register"
            className="px-6 py-2.5 rounded-lg text-white font-semibold text-lg
                       bg-emerald-600
                       hover:bg-emerald-700
                       transition-all duration-200 shadow-sm"
          >
            Registrarse
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-6 text-gray-700 text-sm">
        © {new Date().getFullYear()} SaludHogar
      </footer>
    </div>
  );
}

export default Landing;
