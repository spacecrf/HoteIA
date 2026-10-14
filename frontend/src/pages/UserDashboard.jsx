import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, CreditCard, Trash2, CheckCircle, Clock, XCircle, ChevronRight, MapPin, Info, X } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ nombre: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comentario: '' });

  useEffect(() => {
    if (user) {
      setProfileFormData({ nombre: user.nombre });
    }
    const fetchBookings = async () => {
      try {
        const res = await api.get('bookings/my');
        setBookings(res.data);
      } catch (err) {
        console.error('Error al cargar reservas', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();

    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('users/profile', profileFormData);
      setUser({ ...user, ...profileFormData });
      setShowProfileModal(false);
    } catch (err) {
      alert('No se pudo actualizar el perfil.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    
    try {
      await api.delete(`bookings/${id}`);
      setBookings(bookings.map(b => b.id === id ? { ...b, estado: 'cancelada' } : b));
    } catch (err) {
      alert('No se pudo cancelar la reserva.');
    }
  };

  const handleConfigurePayment = async () => {
    try {
      const res = await api.post('payments/setup-method');
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        alert('No se pudo iniciar la configuración de pago.');
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al iniciar configuración de pago.');
    }
  };

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setReviewForm({ rating: 5, comentario: '' });
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await api.post('reviews', {
        habitacion_id: selectedBooking.habitacion_id,
        rating: reviewForm.rating,
        comentario: reviewForm.comentario
      });
      setShowReviewModal(false);
    } catch (err) {
      alert('No se pudo enviar la reseña.');
    }
  };

  const handleDownloadReceipt = (booking) => {
    const noches = Math.max(1, differenceInDays(parseISO(booking.fecha_salida), parseISO(booking.fecha_entrada)));
    const precioMedio = (Number(booking.costo_total) / noches).toFixed(2);
    const logoUrl = new URL(`${import.meta.env.BASE_URL}hoteia.svg`, window.location.origin).toString();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Recibo Reserva #${booking.id}</title>
          <style>
            *{box-sizing:border-box}
            body{font-family:Inter,Arial,sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:32px}
            .sheet{max-width:780px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
            .header{display:flex;justify-content:space-between;align-items:center;padding:24px 28px;border-bottom:1px solid #f1f5f9}
            .brand{display:flex;align-items:center;gap:12px}
            .brand img{width:48px;height:48px}
            .brand-name{font-weight:900;font-size:20px;color:#0ea5e9;letter-spacing:.5px}
            .meta{font-size:12px;color:#64748b;text-align:right}
            h1{margin:0 0 8px 0;font-size:22px}
            .content{padding:28px}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
            .card{border:1px solid #e2e8f0;border-radius:12px;padding:16px}
            .label{color:#64748b;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.6px}
            .val{color:#0f172a;font-weight:700;margin-top:4px}
            table{width:100%;border-collapse:collapse;margin-top:8px}
            th,td{text-align:left;padding:12px;border-bottom:1px solid #f1f5f9}
            th{font-size:12px;text-transform:uppercase;color:#64748b}
            tfoot td{font-weight:900;font-size:16px}
            .footer{padding:16px 28px 24px 28px;border-top:1px solid #f1f5f9;font-size:12px;color:#64748b;text-align:center}
            @media print{
              body{background:#fff;padding:0}
              .sheet{border:none;border-radius:0}
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="brand">
                <img src="${logoUrl}" alt="HoteIA" />
                <div class="brand-name">HoteIA</div>
              </div>
              <div class="meta">
                <div><strong>Recibo</strong> #${booking.id}</div>
                <div>${new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div class="content">
              <h1>Confirmación de Reserva</h1>
              <div class="grid">
                <div class="card">
                  <div class="label">Cliente</div>
                  <div class="val">${user?.nombre} · ${user?.email}</div>
                </div>
                <div class="card">
                  <div class="label">Habitación</div>
                  <div class="val">Hab. ${booking.numero_habitacion} · ${booking.tipo_habitacion}</div>
                </div>
                <div class="card">
                  <div class="label">Fechas</div>
                  <div class="val">${format(parseISO(booking.fecha_entrada), 'dd/MM/yyyy')} – ${format(parseISO(booking.fecha_salida), 'dd/MM/yyyy')} (${noches} noche${noches===1?'':'s'})</div>
                </div>
                <div class="card">
                  <div class="label">Estado</div>
                  <div class="val" style="color:${booking.estado==='confirmada'?'#16a34a':'#dc2626'}">${booking.estado}</div>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Concepto</th><th style="text-align:right">Importe</th></tr>
                </thead>
                <tbody>
                  <tr><td>Estancia (${noches} × ${precioMedio}€)</td><td style="text-align:right">${Number(booking.costo_total).toFixed(2)}€</td></tr>
                </tbody>
                <tfoot>
                  <tr><td>Total</td><td style="text-align:right">${Number(booking.costo_total).toFixed(2)}€</td></tr>
                </tfoot>
              </table>
            </div>
            <div class="footer">
              Gracias por confiar en HoteIA. Si necesitas ayuda, responde a este mensaje.
            </div>
          </div>
          <script>
            window.print();
            setTimeout(()=>window.close(), 500);
          </script>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmada':
        return <span className="flex items-center space-x-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100"><CheckCircle className="w-3.5 h-3.5" /> <span>Confirmada</span></span>;
      case 'pendiente':
        return <span className="flex items-center space-x-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-100"><Clock className="w-3.5 h-3.5" /> <span>Pendiente</span></span>;
      case 'cancelada':
        return <span className="flex items-center space-x-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100"><XCircle className="w-3.5 h-3.5" /> <span>Cancelada</span></span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-green-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-green-100"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <p className="font-bold">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-white/10 rounded-lg transition"><XCircle className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Profile Card */}
        <aside className="md:w-1/3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-4"
          >
            <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <User className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">{user?.nombre}</h3>
              <p className="text-slate-500 text-sm">{user?.email}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-center space-x-4">
              <button onClick={() => setShowProfileModal(true)} className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-xl transition">Editar Perfil</button>
            </div>
          </motion.div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h4 className="font-bold flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-primary-400" />
                <span>Métodos de Pago</span>
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">Gestiona tus tarjetas y facturación para reservas rápidas.</p>
              <button onClick={handleConfigurePayment} className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 rounded-xl border border-white/10 transition">
                Configurar Pago
              </button>
            </div>
          </div>
        </aside>

        {/* Bookings List */}
        <main className="md:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Mis Reservas</h2>
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{bookings.length} {bookings.length === 1 ? 'Reserva' : 'Reservas'}</span>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="bg-white h-32 rounded-3xl animate-pulse border border-slate-100 shadow-sm" />)
            ) : bookings.length > 0 ? (
              bookings.map((booking) => (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition group"
                >
                  <div className="w-full md:w-32 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                    <img 
                      src={`https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80&sig=${booking.habitacion_id}`} 
                      className="w-full h-full object-cover" 
                      alt="Habitación"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 flex items-center">
                          Habitación {booking.numero_habitacion}
                          <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                          <span className="text-slate-500 font-medium text-sm">{booking.tipo_habitacion}</span>
                        </h4>
                        <div className="flex items-center space-x-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> Madrid, España</span>
                          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {format(parseISO(booking.fecha_entrada), 'd MMM', { locale: es })} - {format(parseISO(booking.fecha_salida), 'd MMM yyyy', { locale: es })}</span>
                        </div>
                      </div>
                      {getStatusBadge(booking.estado)}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm font-bold text-slate-800">Total: {booking.costo_total}€</p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenReview(booking)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-800 transition p-2 hover:bg-slate-50 rounded-xl"
                        >
                          Dejar Reseña
                        </button>
                        <button 
                          onClick={() => handleDownloadReceipt(booking)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-800 transition p-2 hover:bg-slate-50 rounded-xl"
                        >
                          Descargar Recibo
                        </button>
                        {booking.estado === 'confirmada' && (
                          <button 
                            onClick={() => handleCancel(booking.id)}
                            className="flex items-center space-x-1 text-red-500 hover:text-red-600 text-xs font-bold transition p-2 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancelar Reserva</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl text-center space-y-4 border border-slate-100 shadow-sm">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">No tienes reservas activas</h4>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">Empieza a explorar nuestras habitaciones y vive una experiencia única.</p>
                <button onClick={() => navigate('/search')} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-100">
                  Explorar Habitaciones
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfileModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Editar Perfil</h3>
                <button onClick={() => setShowProfileModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                  <input type="text" required value={profileFormData.nombre} onChange={(e) => setProfileFormData({...profileFormData, nombre: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                </div>
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-primary-100">
                  Guardar Cambios
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookingModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Detalle de Reserva</h3>
                <button onClick={() => setShowBookingModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-48 h-36 rounded-2xl overflow-hidden">
                    <img src={`https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80&sig=${selectedBooking.habitacion_id}`} className="w-full h-full object-cover" alt="Habitación" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-xl font-bold text-slate-800">Habitación {selectedBooking.numero_habitacion} · {selectedBooking.tipo_habitacion}</h4>
                    <div className="text-slate-500 text-sm">
                      <p>Fechas: {format(parseISO(selectedBooking.fecha_entrada), 'dd/MM/yyyy')} — {format(parseISO(selectedBooking.fecha_salida), 'dd/MM/yyyy')} ({Math.max(1, differenceInDays(parseISO(selectedBooking.fecha_salida), parseISO(selectedBooking.fecha_entrada)))} noche{Math.max(1, differenceInDays(parseISO(selectedBooking.fecha_salida), parseISO(selectedBooking.fecha_entrada))) === 1 ? '' : 's'})</p>
                      <p>Huéspedes: {selectedBooking.numero_huespedes || 1}</p>
                      <p>Total: {selectedBooking.costo_total}€</p>
                      <p>Estado: {selectedBooking.estado}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => handleDownloadReceipt(selectedBooking)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition">Descargar Recibo</button>
                  {selectedBooking.estado === 'confirmada' && (
                    <button onClick={() => { setShowBookingModal(false); handleCancel(selectedBooking.id); }} className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-600 transition">Cancelar Reserva</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showReviewModal && selectedBooking && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReviewModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Dejar Reseña</h3>
                <button onClick={() => setShowReviewModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={submitReview} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Puntuación</label>
                  <select value={reviewForm.rating} onChange={(e)=>setReviewForm({...reviewForm, rating: Number(e.target.value)})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl">
                    {[5,4,3,2,1].map(v=><option key={v} value={v}>{v} {v===1?'estrella':'estrellas'}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Comentario</label>
                  <textarea rows="4" value={reviewForm.comentario} onChange={(e)=>setReviewForm({...reviewForm, comentario: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl" placeholder="Cuéntanos tu experiencia..." />
                </div>
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl">Enviar Reseña</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;
