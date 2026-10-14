import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión. Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // Simulación de envío de correo
    setForgotPasswordSuccess(true);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Error al iniciar sesión con Google.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-bold text-slate-800">Bienvenido de nuevo</h2>
          <p className="text-slate-500">Accede a tu cuenta de HoteIA</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3 mb-6 border border-red-100"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full bg-slate-50 border-slate-200 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700">Contraseña</label>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-semibold text-primary-600 hover:text-primary-700">¿Olvidaste tu contraseña?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-50 border-slate-200 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-primary-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-4">
          <div className="flex items-center w-full space-x-2">
            <div className="h-[1px] bg-slate-100 flex-1" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">O continúa con</span>
            <div className="h-[1px] bg-slate-100 flex-1" />
          </div>
          
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error al iniciar sesión con Google')}
              useOneTap
              theme="outline"
              shape="pill"
              size="large"
              width="100%"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            ¿No tienes una cuenta? {' '}
            <Link to="/register" className="text-primary-600 font-bold hover:underline inline-flex items-center">
              Regístrate aquí <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForgotPassword(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                {forgotPasswordSuccess ? (
                  <div className="text-center space-y-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <h3 className="text-xl font-bold text-slate-800">Correo Enviado</h3>
                    <p className="text-slate-500">Hemos enviado un enlace de recuperación a tu correo electrónico.</p>
                    <button onClick={() => { setShowForgotPassword(false); setForgotPasswordSuccess(false); }} className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl mt-4">Entendido</button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800">Recuperar Contraseña</h3>
                    <p className="text-slate-500 text-sm">Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
                      <input type="email" required value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                    </div>
                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition">
                      Enviar Enlace
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
