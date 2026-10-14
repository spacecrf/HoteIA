import { motion } from 'framer-motion';
import { Search, MapPin, ShieldCheck, Sparkles, Wifi, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    entrada: '',
    salida: '',
    huespedes: 1
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search', { state: searchData });
  };

  const features = [
    { icon: <ShieldCheck className="w-6 h-6 text-primary-600" />, title: "Seguridad 24/7", desc: "Sistemas avanzados de vigilancia y control de acceso." },
    { icon: <Wifi className="w-6 h-6 text-primary-600" />, title: "WiFi de Alta Velocidad", desc: "Conexión gratuita y estable en todo el complejo." },
    { icon: <Coffee className="w-6 h-6 text-primary-600" />, title: "Desayuno Premium", desc: "Buffet gourmet con productos locales de primera calidad." },
    { icon: <Sparkles className="w-6 h-6 text-primary-600" />, title: "Asistente IA", desc: "Nuestra inteligencia artificial te ayuda con cualquier duda." }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center text-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-800/60 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Hotel"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 text-center space-y-6 px-4"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Bienvenido a <span className="text-primary-500">HoteIA</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto">
            La elegancia de siempre con la inteligencia del mañana. 
            Reserva tu estancia de ensueño hoy mismo.
          </p>
          
          {/* Quick Search Bar */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl max-w-4xl mx-auto shadow-xl border border-white/20">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 text-left">
                <label className="text-sm font-semibold text-slate-200 ml-1">Entrada</label>
                <input 
                  type="date" 
                  name="entrada"
                  required
                  className="w-full bg-white text-slate-800 px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-primary-500"
                  value={searchData.entrada}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-semibold text-slate-200 ml-1">Salida</label>
                <input 
                  type="date" 
                  name="salida"
                  required
                  className="w-full bg-white text-slate-800 px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-primary-500"
                  value={searchData.salida}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-semibold text-slate-200 ml-1">Huéspedes</label>
                <select 
                  name="huespedes"
                  className="w-full bg-white text-slate-800 px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-primary-500"
                  value={searchData.huespedes}
                  onChange={handleInputChange}
                >
                  {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Persona' : 'Personas'}</option>)}
                </select>
              </div>
              <button 
                type="submit" 
                className="bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-lg"
              >
                <Search className="w-5 h-5" />
                <span>Buscar</span>
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold text-slate-800">¿Por qué elegir HoteIA?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Combinamos hospitalidad clásica con tecnología de vanguardia para ofrecerte una experiencia inolvidable.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4 hover:shadow-md transition"
            >
              <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                {feature.icon}
              </div>
              <h3 className="font-bold text-slate-800">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Location Section */}
      <section className="bg-white py-16 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-primary-600 font-semibold">
              <MapPin className="w-5 h-5" />
              <span>UBICACIÓN PRIVILEGIADA</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-800">En el corazón de la ciudad</h2>
            <p className="text-slate-600 leading-relaxed">
              HoteIA se encuentra estratégicamente ubicado en el centro neurálgico, a pocos minutos de los principales atractivos turísticos, centros de negocios y la zona comercial. 
              <br /><br />
              Dirección: Avenida de la Inteligencia, 42. 28001 Madrid, España.
            </p>
            <a href="https://www.google.com/maps/search/?api=1&query=Avenida+de+la+Inteligencia+42+28001+Madrid+España" target="_blank" rel="noopener noreferrer" className="inline-block bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition">
              Cómo llegar
            </a>
          </div>
          <div className="h-[400px] rounded-2xl overflow-hidden shadow-inner grayscale hover:grayscale-0 transition duration-500">
            {/* Simulación de Google Maps para el TFG */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12148.68114674384!2d-3.703790!3d40.416775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDI1JzAwLjQiTiAzwrA0MicxMy42Ilc!5e0!3m2!1ses!2ses!4v1620000000000!5m2!1ses!2ses" 
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
