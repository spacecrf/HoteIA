import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('auth/user');
        setUser(res.data);
      } catch (err) {
        console.error('Error al cargar usuario', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };
  loadUser();
}, []);

const login = async (email, password) => {
  try {
    const res = await api.post('auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      const userRes = await api.get('auth/user');
      setUser(userRes.data);
      return userRes.data;
    }
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};

const googleLogin = async (idToken) => {
  try {
    const res = await api.post('auth/google', { idToken });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      const userRes = await api.get('auth/user');
      setUser(userRes.data);
      return userRes.data;
    }
  } catch (err) {
    console.error('Google login error:', err);
    throw err;
  }
};

const register = async (nombre, email, password) => {
  try {
    const res = await api.post('auth/register', { nombre, email, password });
      // El registro ahora solo devuelve un mensaje de éxito, el usuario debe loguearse
      return res.data;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, isAdmin: user?.rol_id === 2 }}>
      {children}
    </AuthContext.Provider>
  );
};
