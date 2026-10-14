import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);
  const [filters, setFilters] = useState({
    entrada: new Date().toISOString().split('T')[0],
    salida: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
    huespedes: 1
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(null);
  const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51T7DGQ25nzqSvWtbiTpPb6wRcjZVSBvd4PsV1fRft1Jbu17dUsq9wGlUw0Yj6ovE2uLzvrlYdHSsmHVrlG8aTcIS00QxsfzHwz';
  const stripePromise = loadStripe(STRIPE_PK);
  const [sessionId] = useState(() => {
    // Generar o recuperar ID de sesión para el historial
    let id = localStorage.getItem('ai_session_id');
    if (!id) {
      id = Math.random().toString(36).substring(7);
      localStorage.setItem('ai_session_id', id);
    }
    return id;
  });

  const chatEndRef = useRef(null);

  // Cargar historial al iniciar
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`ai/history/${sessionId}`);
        const history = res.data.flatMap(h => [
          { type: 'user', text: h.mensaje },
          { type: 'bot', text: h.respuesta }
        ]);
        setChatHistory(history);
      } catch (err) {
        console.error('Error al cargar historial IA', err);
      }
    };
    fetchHistory();
  }, [sessionId]);

  // Auto-scroll al final
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = { type: 'user', text: message };
    setChatHistory([...chatHistory, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('ai/chat', { message, sessionId });
      setChatHistory(prev => [...prev, { type: 'bot', text: res.data.response }]);
      if (res.data.response.toLowerCase().includes('disponibilidad')) {
        setShowAvailabilityPanel(true);
      }
    } catch (err) {
      console.error('Error en el chat IA', err);
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Lo siento, he tenido un problema técnico. ¿Puedes repetir?' }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await api.post('rooms/available', {
        fechaEntrada: filters.entrada,
        fechaSalida: filters.salida,
        capacidad: filters.huespedes
      });
      setAvailableRooms(res.data);
      const summary = res.data.length > 0 
        ? `He encontrado ${res.data.length} opciones disponibles para esas fechas.` 
        : 'No hay habitaciones disponibles para esos criterios.';
      setChatHistory(prev => [...prev, { type: 'bot', text: summary }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { type: 'bot', text: 'No he podido consultar disponibilidad ahora mismo.' }]);
    }
  };

  const handleReserve = async (roomId) => {
    setBookingLoading(roomId);
    try {
      const res = await api.post('payments/create-checkout-session', {
        habitacion_id: roomId,
        fecha_entrada: filters.entrada,
        fecha_salida: filters.salida,
        numero_huespedes: filters.huespedes
      });
      if (res.data.simulated) {
        window.location.href = '/payment-success';
        return;
      }
      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: res.data.id });
    } catch (err) {
      setChatHistory(prev => [...prev, { type: 'bot', text: 'No he podido iniciar el pago. Prueba de nuevo.' }]);
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Asistente HoteIA</h3>
                  <p className="text-xs text-primary-100 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                    En línea ahora
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatHistory.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <Bot className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-400 text-sm">¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy?</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] items-end space-x-2 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    <div className={`p-2 rounded-lg ${msg.type === 'user' ? 'bg-primary-50 text-primary-700' : 'bg-white shadow-sm border border-slate-100 text-slate-700'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {showAvailabilityPanel && (
                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="date" value={filters.entrada} onChange={(e)=>setFilters({...filters, entrada: e.target.value})} className="bg-slate-100 px-2 py-1 rounded-lg text-sm" />
                    <input type="date" value={filters.salida} onChange={(e)=>setFilters({...filters, salida: e.target.value})} className="bg-slate-100 px-2 py-1 rounded-lg text-sm" />
                    <select value={filters.huespedes} onChange={(e)=>setFilters({...filters, huespedes: Number(e.target.value)})} className="bg-slate-100 px-2 py-1 rounded-lg text-sm">
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n===1?'Persona':'Personas'}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={fetchAvailability} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Buscar</button>
                    <button onClick={()=>setShowAvailabilityPanel(false)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">Cerrar</button>
                  </div>
                  {availableRooms.length > 0 && (
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                      {availableRooms.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-2">
                          <div className="text-xs text-slate-600 font-semibold">Hab. {r.numero_habitacion} · {r.tipo_habitacion} · {r.precio_noche}€</div>
                          <button disabled={bookingLoading===r.id} onClick={()=>handleReserve(r.id)} className="bg-primary-600 text-white px-2 py-1 rounded-lg text-xs font-bold disabled:opacity-50">{bookingLoading===r.id?'...':'Reservar'}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex space-x-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 bg-slate-100 border-none px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
              />
              <button 
                type="button"
                onClick={()=>setShowAvailabilityPanel(true)}
                className="bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                Buscar disponibilidad
              </button>
              <button 
                type="submit" 
                disabled={!message.trim() || loading}
                className="bg-primary-600 text-white p-2 rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-600 text-white p-4 rounded-2xl shadow-2xl hover:bg-primary-700 transition flex items-center space-x-2"
      >
        <MessageSquare className="w-6 h-6" />
        {!isOpen && <span className="font-bold hidden md:block">¿Necesitas ayuda?</span>}
      </motion.button>
    </div>
  );
};

export default AIChat;
