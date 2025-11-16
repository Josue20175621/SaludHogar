import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifier } from '../context/NotificationContext';
import type { AxiosError } from 'axios';
import { authApi } from '../api/axios';

const validateEmail = (email: string): string => {
  if (!email) {
    return 'El correo electrónico es obligatorio.';
  }

  const regex = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) {
    return 'Por favor, introduce un correo electrónico válido.';
  }
  return '';
};


function Login() {
  const { fetchAndSetUser, preAuthToken, setPreAuthToken } = useAuth();
  const { notify } = useNotifier();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // State for validation errors
  const [emailError, setEmailError] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTwoFactor, setShowTwoFactor] = useState<boolean>(() => !!preAuthToken);
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [twoFactorLoading, setTwoFactorLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.post('/login', { email, password });

      // Check if user has 2FA enabled
      if (response.data.requires_2fa) {
        setPreAuthToken(response.data.token);
        setShowTwoFactor(true);
      } else {
        await fetchAndSetUser();
        navigate('/app');
      }

    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesion'; // default

      // check if the error has a response from the server
      if (error.response && error.response.data && error.response.data.detail) {
        const detail = error.response.data.detail;

        // handle FastAPI/Pydantic 422 Validation Error (detail is an array)
        if (Array.isArray(detail) && detail.length > 0) {
          // Use the message from the first validation error
          errorMessage = detail[0].msg;

          // handle manual HTTPException errors (detail is a string)
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }

      // use the parsed message, or the default if parsing failed
      notify(errorMessage, 'error');

    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTwoFactorLoading(true);

    try {
      await handleTwoFactorVerification(twoFactorCode);
    } catch (error: any) {
      notify(error.message, 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorVerification = async (code: string) => {
    if (!preAuthToken) {
      notify('La sesión ha expirado. Por favor, inicia sesión otra vez.', 'error');
    }
    try {
      await authApi.post('/2fa/verify', { code, token: preAuthToken });

      // Login successful with 2FA
      setPreAuthToken(null);
      fetchAndSetUser();
      navigate('/app');
    } catch (err: any) {
      setTwoFactorCode('');

      const axiosErr = err as AxiosError<{ detail?: string }>;
      const errorMessage = axiosErr.response?.data?.detail
        ?? 'Código de verificación inválido o expirado.';

      notify(errorMessage, 'error');
    }
  };

  const handleBackFrom2FA = () => {
    setShowTwoFactor(false);
    setTwoFactorCode('');
    setPassword('');
    setPreAuthToken(null);
  };

  // Handle input changes for 2FA code (format and validate)
  const handleTwoFactorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setTwoFactorCode(value);
    }
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center p-4">
        {/* Back Button */}
        <button
          onClick={handleBackFrom2FA}
          className="absolute top-6 left-6 flex items-center gap-2 text-cyan-700 hover:text-cyan-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver</span>
        </button>

        {/* 2FA Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-gray-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Verificación de Seguridad
              </h1>
              <p className="text-gray-600">
                Ingresa el código de tu aplicación autenticadora
              </p>
            </div>

            {/* 2FA Form */}
            <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
              {/* 2FA Code Input */}
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificación
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={handleTwoFactorCodeChange}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Ingresa el código de 6 dígitos
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
                className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {twoFactorLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando...
                  </div>
                ) : (
                  'Verificar código'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver</span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-full mb-4">
              <Heart className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-gray-600">
              Ingresa a tu cuenta de SaludHogar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  placeholder="tu@ejemplo.com"
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/50 ${emailError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-cyan-500'
                    }`}
                />
              </div>
              {/* Error Message Display */}
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
            </div>

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
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;