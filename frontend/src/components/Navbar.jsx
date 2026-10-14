import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, LayoutDashboard, Search as SearchIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary-600 font-bold text-2xl">
            <img src={`${import.meta.env.BASE_URL}hoteia.svg`} alt="HoteIA" className="w-8 h-8" />
            <span>HoteIA</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/search" className="flex items-center space-x-1 text-slate-600 hover:text-primary-600 transition">
              <SearchIcon className="w-4 h-4" />
              <span>Buscar</span>
            </Link>

            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-1 text-slate-600 hover:text-primary-600 transition">
                  <User className="w-4 h-4" />
                  <span>Mi Perfil</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 text-primary-600 font-semibold hover:text-primary-700 transition">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-slate-600 hover:text-primary-600 transition">Entrar</Link>
                <Link to="/register" className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-slate-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Content */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-3">
            <Link to="/search" className="block text-slate-600 py-2">Buscar</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block text-slate-600 py-2">Mi Perfil</Link>
                {isAdmin && <Link to="/admin" className="block text-primary-600 font-semibold py-2">Admin</Link>}
                <button onClick={handleLogout} className="w-full text-left text-slate-600 py-2">Salir</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-slate-600 py-2">Entrar</Link>
                <Link to="/register" className="block bg-primary-600 text-white px-4 py-2 rounded-lg text-center">Registrarse</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
