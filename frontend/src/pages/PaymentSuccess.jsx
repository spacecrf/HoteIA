import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const calledRef = useRef(false);

  useEffect(() => {
    const confirmPayment = async () => {
      if (calledRef.current) return;
      calledRef.current = true;
      // Si venimos de una simulación exitosa
      if (location.state?.bookingId) {
        setLoading(false);
        setTimeout(() => {
          navigate('/dashboard', { state: { message: '¡Reserva realizada con éxito!' } });
        }, 3000);
        return;
      }

      if (sessionId) {
        try {
          await api.post('payments/confirm', { session_id: sessionId });
          setLoading(false);
          setTimeout(() => {
            navigate('/dashboard', { state: { message: '¡Pago confirmado y reserva realizada!' } });
          }, 3000);
        } catch (err) {
          console.error('Error al confirmar pago', err);
          navigate('/search', { state: { error: 'No se pudo confirmar el pago' } });
        }
      } else {
        // Si no hay sessionId ni bookingId en el estado, algo ha ido mal
        navigate('/search');
      }
    };
    confirmPayment();
  }, [sessionId, navigate, location.state]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        {loading ? (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">Confirmando tu pago...</h2>
            <p className="text-slate-500">Estamos procesando los detalles de tu reserva.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">¡Pago Exitoso!</h2>
            <p className="text-slate-500">Tu reserva ha sido confirmada. Redirigiendo a tu perfil...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
