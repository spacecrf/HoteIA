import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Euro, Hotel, Plus, Edit, Trash2, 
  Search as SearchIcon, Filter, MoreVertical, X, CheckCircle, Info, LayoutDashboard, Calendar
} from 'lucide-react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement 
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, todayOccupancy: 0 });
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, rooms, bookings
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormData, setRoomFormData] = useState({
    numero_habitacion: '', tipo_habitacion: 'Doble', capacidad: 2, precio_noche: 100, descripcion: '', photo_url: ''
  });
  const [roomTypes, setRoomTypes] = useState([]);
  const [newRoomType, setNewRoomType] = useState('');
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [chartData, setChartData] = useState({ revenue: { labels: [], datasets: [] }, occupancy: { labels: [], datasets: [] } });

  useEffect(() => {
    fetchData();
  }, []);

  const processChartData = (bookings, rooms) => {
    // Revenue per day of the week
    const revenueByDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    bookings.forEach(b => {
      if (b.estado === 'confirmada') {
        const day = new Date(b.fecha_entrada).getDay();
        revenueByDay[day] += parseFloat(b.costo_total);
      }
    });

    setChartData({
      revenue: {
        labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        datasets: [{
          label: 'Ingresos Semanales (€)',
          data: revenueByDay,
          backgroundColor: 'rgba(14, 165, 233, 0.8)',
          borderRadius: 8,
        }]
      },
      occupancy: {
        labels: ['Ocupadas', 'Disponibles'],
        datasets: [{
          data: [stats.todayOccupancy, rooms.length > 0 ? rooms.length - stats.todayOccupancy : 0],
          backgroundColor: ['#0ea5e9', '#f1f5f9'],
          borderWidth: 0,
        }]
      }
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, roomsRes, bookingsRes, typesRes] = await Promise.all([
        api.get('bookings/stats'),
        api.get('rooms'),
        api.get('bookings/all'),
        api.get('room-types')
      ]);
      setStats(statsRes.data);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
      setRoomTypes(typesRes.data);
      processChartData(bookingsRes.data, roomsRes.data); // Procesar datos para las gráficas
    } catch (err) {
      console.error('Error al cargar datos de admin', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.put(`rooms/${editingRoom.id}`, roomFormData);
      } else {
        await api.post('rooms', roomFormData);
      }
      setShowRoomModal(false);
      setEditingRoom(null);
      setRoomFormData({ numero_habitacion: '', tipo_habitacion: 'Doble', capacidad: 2, precio_noche: 100, descripcion: '', photo_url: '' });
      fetchData();
    } catch (err) {
      console.error('Error al guardar habitación', err);
    }
  };

  const deleteRoom = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta habitación?')) {
      try {
        await api.delete(`rooms/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error al eliminar habitación', err);
      }
    }
  };

  const handleAddRoomType = async () => {
    if (!newRoomType.trim()) return;
    try {
      await api.post('room-types', { nombre: newRoomType });
      setNewRoomType('');
      setShowNewTypeModal(false);
      fetchData();
    } catch (err) {
      console.error('Error al añadir tipo de habitación', err);
    }
  };

  // Datos para gráficas (usando chartData del estado)
  const revenueData = chartData.revenue;
  const occupancyData = chartData.occupancy;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center space-x-2">
            <LayoutDashboard className="w-8 h-8 text-primary-600" />
            <span>Panel de Control</span>
          </h2>
          <p className="text-slate-500">Gestión global del hotel HoteIA</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Vista General
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'rooms' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Habitaciones
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'bookings' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Reservas
          </button>
        </div>
      </div>

      {activeTab === 'overview' && chartData.revenue.labels.length > 0 && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="bg-primary-50 w-12 h-12 rounded-2xl flex items-center justify-center"><Euro className="w-6 h-6 text-primary-600" /></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ingresos Totales</p>
              <h4 className="text-3xl font-black text-slate-800">{parseFloat(stats.totalRevenue).toFixed(2)}€</h4>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center"><Calendar className="w-6 h-6 text-amber-600" /></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Reservas Confirmadas</p>
              <h4 className="text-3xl font-black text-slate-800">{stats.totalBookings}</h4>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center"><Hotel className="w-6 h-6 text-green-600" /></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ocupación Hoy</p>
              <h4 className="text-3xl font-black text-slate-800">{stats.todayOccupancy} <span className="text-sm font-bold text-slate-400">/ {rooms.length}</span></h4>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="font-bold text-slate-800">Evolución de Ingresos</h3>
              <div className="h-64"><Bar data={chartData.revenue} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center space-y-6">
              <h3 className="font-bold text-slate-800 self-start">Ocupación Actual</h3>
              <div className="h-64 w-64"><Doughnut data={chartData.occupancy} options={{ cutout: '70%' }} /></div>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-primary-500 rounded-full" /><span className="text-xs font-bold text-slate-500">Ocupadas</span></div>
                <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-slate-100 rounded-full" /><span className="text-xs font-bold text-slate-500">Libres</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-800 text-xl">Gestión de Habitaciones</h3>
            <button 
              onClick={() => { setEditingRoom(null); setRoomFormData({ numero_habitacion: '', tipo_habitacion: roomTypes[0]?.nombre || 'Doble', capacidad: 2, precio_noche: 100, descripcion: '', photo_url: '' }); setShowRoomModal(true); }}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-primary-100"
            >
              <Plus className="w-5 h-5" />
              <span>Añadir Habitación</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Nº Habitación</th>
                  <th className="px-8 py-4">Tipo</th>
                  <th className="px-8 py-4">Capacidad</th>
                  <th className="px-8 py-4">Precio / Noche</th>
                  <th className="px-8 py-4">Foto</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50 transition group">
                    <td className="px-8 py-5 font-bold text-slate-700">{room.numero_habitacion}</td>
                    <td className="px-8 py-5 text-slate-500 text-sm">{room.tipo_habitacion}</td>
                    <td className="px-8 py-5 text-slate-500 text-sm font-semibold">{room.capacidad} Pers.</td>
                    <td className="px-8 py-5 text-slate-800 font-black">{room.precio_noche}€</td>
                    <td className="px-8 py-5">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100">
                        <img src={room.photo_url || `https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80&sig=${room.id}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => { setEditingRoom(room); setRoomFormData(room); setShowRoomModal(true); }}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteRoom(room.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-xl">Registro Global de Reservas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Usuario</th>
                  <th className="px-8 py-4">Habitación</th>
                  <th className="px-8 py-4">Fechas</th>
                  <th className="px-8 py-4">Total</th>
                  <th className="px-8 py-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition">
                    <td className="px-8 py-5">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-700">{booking.nombre_usuario}</p>
                        <p className="text-[10px] text-slate-400">{booking.email_usuario}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-semibold text-slate-500">{booking.numero_habitacion}</td>
                    <td className="px-8 py-5 text-slate-500 text-xs font-bold uppercase tracking-widest">
                      {booking.fecha_entrada} - {booking.fecha_salida}
                    </td>
                    <td className="px-8 py-5 text-slate-800 font-black">{booking.costo_total}€</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        booking.estado === 'confirmada' ? 'bg-green-50 text-green-600 border-green-100' : 
                        booking.estado === 'cancelada' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {booking.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Habitaciones */}
      <AnimatePresence>
        {showRoomModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRoomModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">{editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}</h3>
                <button onClick={() => setShowRoomModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleRoomSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nº Habitación</label>
                    <input type="text" required value={roomFormData.numero_habitacion} onChange={(e) => setRoomFormData({...roomFormData, numero_habitacion: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                    <div className="flex items-center gap-2">
                      <select value={roomFormData.tipo_habitacion} onChange={(e) => setRoomFormData({...roomFormData, tipo_habitacion: e.target.value})} className="flex-1 bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition">
                        {roomTypes.length > 0 ? roomTypes.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>) : ['Individual','Doble','Suite Junior','Familiar'].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <button type="button" onClick={()=>setShowNewTypeModal(true)} className="bg-primary-600 text-white px-3 py-2 rounded-xl text-xs font-bold">Añadir nuevo tipo</button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Capacidad</label>
                    <input type="number" required value={roomFormData.capacidad} onChange={(e) => setRoomFormData({...roomFormData, capacidad: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Precio / Noche (€)</label>
                    <input type="number" step="0.01" required value={roomFormData.precio_noche} onChange={(e) => setRoomFormData({...roomFormData, precio_noche: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                  <textarea rows="3" required value={roomFormData.descripcion} onChange={(e) => setRoomFormData({...roomFormData, descripcion: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">URL de Foto</label>
                  <input type="url" placeholder="https://..." value={roomFormData.photo_url} onChange={(e) => setRoomFormData({...roomFormData, photo_url: e.target.value})} className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                  {roomFormData.photo_url && (
                    <div className="mt-2 w-full h-36 rounded-xl overflow-hidden bg-slate-100">
                      <img src={roomFormData.photo_url} alt="Vista previa" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-primary-100">
                  {editingRoom ? 'Guardar Cambios' : 'Crear Habitación'}
                </button>
              </form>
              {showNewTypeModal && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 text-center">Nuevo Tipo de Habitación</h4>
                    <input type="text" value={newRoomType} onChange={(e)=>setNewRoomType(e.target.value)} placeholder="Ej: Deluxe, Suite Presidencial..." className="w-full bg-slate-50 border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary-500 transition" />
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={()=>setShowNewTypeModal(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">Cancelar</button>
                      <button onClick={async()=>{ if(!newRoomType.trim()) return; try{ await api.post('/room-types', { nombre: newRoomType.trim() }); await fetchData(); setRoomFormData({...roomFormData, tipo_habitacion: newRoomType.trim()}); setNewRoomType(''); setShowNewTypeModal(false); } catch(e){ alert('No se pudo crear el tipo'); } }} className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold">Guardar</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
