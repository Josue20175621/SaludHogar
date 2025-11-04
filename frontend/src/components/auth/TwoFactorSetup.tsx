import { useState } from 'react';
import QRCodeSVG from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, ArrowLeft, Smartphone } from 'lucide-react';
import { authApi } from '../../api/axios';

interface TOTPSetup {
  secret: string;
  otp_auth_url: string;
}

const TwoFactorSetup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState<TOTPSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  const generateQRCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.post('/2fa/setup');
      setQrData(response.data);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    if (!qrData) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authApi.post('/2fa/verify-setup', {
        secret: qrData.secret,
        totp_code: verificationCode
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: any) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setVerificationCode(value);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setQrData(null);
    setVerificationCode('');
    setError('');
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center p-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/app')}
          className="absolute top-6 left-6 flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver</span>
        </button>

        {/* Setup Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Configurar Autenticación de Dos Factores
              </h1>
              <p className="text-gray-600">
                Asegura tu cuenta con una aplicación autenticadora
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Info Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-emerald-800 mb-2">Antes de comenzar:</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Instala una aplicación autenticadora (Google Authenticator, Authy, 2FAS Auth, etc.)</li>
                <li>• Asegúrate de que tu dispositivo esté listo para escanear un código QR</li>
              </ul>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQRCode}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generando...
                </div>
              ) : (
                'Generar Código QR'
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            La autenticación de dos factores mejora significativamente la seguridad de tu cuenta
          </p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center p-4">
        {/* Back Button */}
        <button 
          onClick={resetFlow}
          className="absolute top-6 left-6 flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver</span>
        </button>

        {/* QR Code Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Escanear Código QR
              </h1>
              <p className="text-gray-600">
                Usa tu aplicación autenticadora para escanear este código
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={qrData?.otp_auth_url || ''}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              {/* Manual entry option */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">¿No puedes escanear? Ingresa este código manualmente:</p>
                <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm break-all text-center">
                  {qrData?.secret}
                </div>
              </div>

              {/* Verification code input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingresa el código de 6 dígitos de tu aplicación autenticadora:
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  placeholder="123456"
                  className="w-full p-3 border border-gray-200 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  maxLength={6}
                />
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={resetFlow}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={verifyAndEnable2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verificando...
                    </div>
                  ) : (
                    'Verificar y Habilitar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center p-4">
        {/* Success Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                ¡2FA Habilitado Exitosamente!
              </h1>
              <p className="text-gray-600 mb-6">
                Tu cuenta ahora está protegida con autenticación de dos factores
              </p>

              {/* Important Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-amber-800 mb-2">Importante:</h3>
                <ul className="text-sm text-amber-700 space-y-1 text-left">
                  <li>• Guarda los códigos de respaldo si tu aplicación los proporciona</li>
                  <li>• Necesitarás tu aplicación autenticadora para iniciar sesión</li>
                  <li>• Mantén tu aplicación autenticadora segura</li>
                </ul>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => navigate('/app')}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continuar a la aplicacion
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Tu cuenta está ahora más segura con 2FA activado
          </p>
        </div>
      </div>
    );
  }
};

export default TwoFactorSetup;