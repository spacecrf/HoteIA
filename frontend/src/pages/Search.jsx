import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Users, Euro, Info, Calendar, ArrowRight, ShieldCheck, Star, Sparkles } from 'lucide-react';
import { format, differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51T7DGQ25nzqSvWtbiTpPb6wRcjZVSBvd4PsV1fRft1Jbu17dUsq9wGlUw0Yj6ovE2uLzvrlYdHSsmHVrlG8aTcIS00QxsfzHwz';
const stripePromise = loadStripe(STRIPE_PK);

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({
    entrada: location.state?.entrada || format(new Date(), 'yyyy-MM-dd'),
    salida: location.state?.salida || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    huespedes: location.state?.huespedes || 1
  });

  const [rooms, setRooms] = useState([]);
  const [reviewStats, setReviewStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCheckoutRoom, setSelectedCheckoutRoom] = useState(null);
  const [extras, setExtras] = useState({ desayuno: false, champagne: false, parking: false, lateCheckout: false });
  const EXTRA_PRICES = { desayuno: 12.5, champagne: 25, parking: 10, lateCheckout: 15 };

  const fetchAvailableRooms = async (searchFilters = filters) => {
    if (!searchFilters.entrada || !searchFilters.salida) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('rooms/available', {
        fechaEntrada: searchFilters.entrada,
        fechaSalida: searchFilters.salida,
        capacidad: searchFilters.huespedes
      });
      setRooms(res.data);
      try {
        const statsEntries = await Promise.all(res.data.map(async (r) => {
          const s = await api.get(`reviews/by-room/${r.id}`);
          return [r.id, s.data];
        }));
        const map = {};
        statsEntries.forEach(([id, s]) => { map[id] = s; });
        setReviewStats(map);
      } catch (_) {}
    } catch (err) {
      console.error('Error al buscar habitaciones', err);
      setError('No se pudieron cargar las habitaciones. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state) {
      const newFilters = {
        entrada: location.state.entrada || filters.entrada,
        salida: location.state.salida || filters.salida,
        huespedes: location.state.huespedes || filters.huespedes
      };
      setFilters(newFilters);
      fetchAvailableRooms(newFilters);
    } else {
      fetchAvailableRooms();
    }
  }, [location.state]);

  const handleBooking = async (roomId) => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const r = rooms.find(r => r.id === roomId);
    setSelectedCheckoutRoom(r || null);
    setShowCheckoutModal(true);
  };

  const getExtrasTotal = () => Object.entries(extras).reduce((sum, [k, v]) => v ? sum + EXTRA_PRICES[k] : sum, 0);

  const proceedToCheckout = async () => {
    if (!selectedCheckoutRoom) return;
    setBookingLoading(selectedCheckoutRoom.id);
    try {
      const selectedExtras = Object.entries(extras)
        .filter(([k, v]) => v)
        .map(([k]) => ({ key: k, name: k === 'lateCheckout' ? 'Late checkout' : k.charAt(0).toUpperCase() + k.slice(1), price: EXTRA_PRICES[k] }));
      const res = await api.post('payments/create-checkout-session', {
        habitacion_id: selectedCheckoutRoom.id,
        fecha_entrada: filters.entrada,
        fecha_salida: filters.salida,
        numero_huespedes: filters.huespedes,
        extras: selectedExtras
      });
      if (res.data.simulated) {
        navigate('/payment-success', { state: { bookingId: res.data.bookingId } });
        return;
      }
      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: res.data.id });
    } catch (err) {
      console.error('Error detallado al realizar reserva:', err.response || err);
      const data = err.response?.data;
      const errorMsg = typeof data === 'string' ? data : (data?.msg || 'Error al conectar con el servidor. Inténtalo de nuevo.');
      alert(`Error al procesar la reserva: ${errorMsg}`);
    } finally {
      setBookingLoading(null);
      setShowCheckoutModal(false);
      setExtras({ desayuno: false, champagne: false, parking: false, lateCheckout: false });
    }
  };

  const getNoches = () => {
    try {
      const start = parseISO(filters.entrada);
      const end = parseISO(filters.salida);
      if (!start || !end || isBefore(end, start)) return 0;
      return Math.max(1, differenceInDays(end, start));
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-primary-600" />
          <span>Tu Estancia en HoteIA</span>
        </h2>
        
        <form onSubmit={(e) => { e.preventDefault(); fetchAvailableRooms(); }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha Entrada</label>
            <input 
              type="date" 
              value={filters.entrada}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setFilters({...filters, entrada: e.target.value})}
              className="w-full bg-slate-50 border-slate-200 px-4 py-2.5 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha Salida</label>
            <input 
              type="date" 
              value={filters.salida}
              min={format(addDays(parseISO(filters.entrada), 1), 'yyyy-MM-dd')}
              onChange={(e) => setFilters({...filters, salida: e.target.value})}
              className="w-full bg-slate-50 border-slate-200 px-4 py-2.5 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Huéspedes</label>
            <select 
              value={filters.huespedes}
              onChange={(e) => setFilters({...filters, huespedes: e.target.value})}
              className="w-full bg-slate-50 border-slate-200 px-4 py-2.5 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500 transition"
            >
              {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Persona' : 'Personas'}</option>)}
            </select>
          </div>
          <button 
            type="submit" 
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-primary-200"
          >
            <SearchIcon className="w-5 h-5" />
            <span>Actualizar</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Habitaciones Disponibles ({rooms.length})</h3>
            <p className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
              {getNoches()} {getNoches() === 1 ? 'Noche' : 'Noches'} seleccionadas
            </p>
          </div>

          <AnimatePresence mode='wait'>
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white h-48 rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
                ))}
              </motion.div>
            ) : rooms.length > 0 ? (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <motion.div 
                    key={room.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition group"
                  >
                    <div className="md:w-64 h-48 relative overflow-hidden">
                      <img 
                        src={room.photo_url || `https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&sig=${room.id}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                        alt={room.tipo_habitacion}
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-primary-700 shadow-sm">
                        {room.tipo_habitacion}
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xl font-bold text-slate-800">Habitación {room.numero_habitacion}</h4>
                          <div className="flex items-center text-amber-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-bold text-slate-400 ml-1">
                              {reviewStats[room.id]?.avg ? `${reviewStats[room.id].avg} (${reviewStats[room.id].count} reseñas)` : 'Sin reseñas'}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{room.descripcion}</p>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Users className="w-3.5 h-3.5 text-primary-500" />
                            <span>Hasta {room.capacidad} personas</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Euro className="w-3.5 h-3.5 text-primary-500" />
                            <span>{room.precio_noche}€ / noche</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            <span>Cancelación Gratuita</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Estancia</p>
                          <p className="text-2xl font-black text-slate-800">{(room.precio_noche * getNoches()).toFixed(2)}€</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { setSelectedRoom(room); setShowRoomModal(true); }}
                            className="text-slate-600 hover:text-slate-800 bg-slate-100 px-4 py-3 rounded-xl font-bold transition"
                          >
                            Más Información
                          </button>
                          <button 
                            onClick={() => handleBooking(room.id)}
                            disabled={bookingLoading === room.id}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition shadow-lg shadow-primary-100 disabled:opacity-50"
                          >
                            {bookingLoading === room.id ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Reservar Ahora</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white p-12 rounded-2xl text-center space-y-4 border border-slate-100 shadow-sm"
              >
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">No hay habitaciones disponibles</h4>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">Prueba con otras fechas o ajusta el número de huéspedes.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-bold">Reserva Inteligente</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Nuestra IA analiza tus preferencias para sugerirte la mejor estancia. Todos los pagos están protegidos y garantizados.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>Mejor precio garantizado</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>Sin comisiones ocultas</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>Atención 24h por IA y humanos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-800">Preguntas Frecuentes</h4>
            <div className="space-y-4">
              <details className="group cursor-pointer">
                <summary className="text-sm font-semibold text-slate-600 flex justify-between items-center list-none">
                  ¿Puedo cancelar mi reserva?
                  <span className="group-open:rotate-180 transition">↓</span>
                </summary>
                <p className="text-xs text-slate-400 mt-2">Sí, puedes cancelar hasta 24h antes de la llegada sin coste alguno desde tu panel de usuario.</p>
              </details>
              <details className="group cursor-pointer">
                <summary className="text-sm font-semibold text-slate-600 flex justify-between items-center list-none">
                  ¿Cómo funciona el asistente IA?
                  <span className="group-open:rotate-180 transition">↓</span>
                </summary>
                <p className="text-xs text-slate-400 mt-2">Nuestro asistente puede responder cualquier duda técnica, ayudarte a elegir habitación o incluso recomendarte lugares locales.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showRoomModal && selectedRoom && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRoomModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Habitación {selectedRoom.numero_habitacion} · {selectedRoom.tipo_habitacion}</h3>
                <button onClick={() => setShowRoomModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition">✕</button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl overflow-hidden">
                    <img src={selectedRoom.photo_url || `https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80&sig=${selectedRoom.id}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-700">{selectedRoom.descripcion}</p>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
                      <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><Users className="w-3.5 h-3.5 text-primary-500 mr-1" /> {selectedRoom.capacidad} personas</span>
                      <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><Euro className="w-3.5 h-3.5 text-primary-500 mr-1" /> {selectedRoom.precio_noche}€ / noche</span>
                      <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"><ShieldCheck className="w-3.5 h-3.5 text-green-500 mr-1" /> Cancelación gratuita</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowRoomModal(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition">Cerrar</button>
                  <button onClick={() => { setShowRoomModal(false); handleBooking(selectedRoom.id); }} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 transition">Reservar esta Habitación</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showCheckoutModal && selectedCheckoutRoom && (
          <div className="fixed inset-0 z-[112] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckoutModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Resumen de reserva</h3>
                <button onClick={() => setShowCheckoutModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition">✕</button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex gap-6">
                  <div className="w-56 h-40 rounded-2xl overflow-hidden">
                    <img src={selectedCheckoutRoom.photo_url || `https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&sig=${selectedCheckoutRoom.id}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xl font-bold text-slate-800">Hab. {selectedCheckoutRoom.numero_habitacion} · {selectedCheckoutRoom.tipo_habitacion}</h4>
                    <p className="text-slate-500 text-sm">{selectedCheckoutRoom.descripcion}</p>
                    <p className="text-slate-500 text-sm">Fechas: {filters.entrada} — {filters.salida} · {getNoches()} noche(s)</p>
                    <p className="text-slate-800 font-bold">Base: {(selectedCheckoutRoom.precio_noche * getNoches()).toFixed(2)}€</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-700 mb-2">Extras</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { key: 'desayuno', label: 'Desayuno', price: EXTRA_PRICES.desayuno },
                      { key: 'champagne', label: 'Champagne', price: EXTRA_PRICES.champagne },
                      { key: 'parking', label: 'Parking', price: EXTRA_PRICES.parking },
                      { key: 'lateCheckout', label: 'Late checkout', price: EXTRA_PRICES.lateCheckout }
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <input type="checkbox" checked={extras[opt.key]} onChange={(e)=>setExtras({...extras, [opt.key]: e.target.checked})} />
                        <span className="text-slate-700">{opt.label} (+{opt.price}€)</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-slate-500 text-sm">Extras: {getExtrasTotal().toFixed(2)}€</div>
                  <div className="text-xl font-black text-slate-800">Total: {(selectedCheckoutRoom.precio_noche * getNoches() + getExtrasTotal()).toFixed(2)}€</div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={()=>setShowCheckoutModal(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition">Cancelar</button>
                  <button onClick={proceedToCheckout} disabled={bookingLoading===selectedCheckoutRoom.id} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">Continuar al pago</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Search;
