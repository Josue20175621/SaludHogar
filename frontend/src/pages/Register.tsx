import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/axios';
import { useNotifier } from '../context/NotificationContext';

function Register() {
  const { fetchAndSetUser } = useAuth();
  const { notify } = useNotifier();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [first_name, setFirstName] = useState<string>('');
  const [last_name, setLastName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<boolean>(false);

  const navigate = useNavigate();

  const prevStep = () => setStep(prev => prev - 1);
  const regex = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

  const handleNextStep = () => {
    if (!first_name.trim() || !last_name.trim() || !email.trim()) {
      notify('Por favor, completa tu nombre, apellido, nombre de familia y correo electrónico.', 'error');
      return;
    }

    if (!regex.test(email)) {
      notify('Por favor, introduce una dirección de correo electrónico válida.', 'error');
      setEmailError(true);
      return false;
    }

    setEmailError(false);
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      notify('Por favor, introduce y confirma tu contraseña.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      notify('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (password.length < 8) {
      notify('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }

    setIsLoading(true);

    const defaultFamilyName = `Familia ${last_name}`;

    try {
      await authApi.post('/register', {
        first_name: first_name,
        last_name: last_name,
        family_name: defaultFamilyName,
        email,
        password,
      });
      await fetchAndSetUser();
      navigate('/app');
    } catch (error: any) {
      notify(error.response?.data?.message || 'Error al crear la cuenta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <Heart className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Únete a SaludHogar
            </h1>
            <p className="text-gray-600">
              {step === 1 ? 'Paso 1: Completa tus datos personales' : 'Paso 2: Asegura tu cuenta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                {/* First Name Field */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre(s)
                  </label>
                  <div className="relative">
                    <input
                      id="first_name"
                      type="text"
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Tu nombre"
                      required
                      className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                  </div>
                </div>

                {/* Last Name Field */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <div className="relative">
                    <input
                      id="last_name"
                      type="text"
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tu apellido"
                      required
                      className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(false);
                      }}
                      placeholder="tu@ejemplo.com"
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 ${emailError ? 'border-red-500' : 'border-gray-200'
                        }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Siguiente <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" /> Anterior
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </button>
                </div>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors duration-200">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;