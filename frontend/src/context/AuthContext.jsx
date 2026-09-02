import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kisanqueue_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'pa'

  useEffect(() => {
    fetchDemoUsers();
    if (token) {
      fetchCurrentUser();
    } else {
      // Default auto-login as Farmer (Ramesh Kumar) for smooth demo evaluation
      autoLoginDefaultDemo();
    }
  }, []);

  const fetchDemoUsers = async () => {
    try {
      const res = await api.get('/auth/demo-users');
      setDemoUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch demo users:', err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const autoLoginDefaultDemo = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: 'ramesh.kumar@kisannexus.gov.in',
        password: 'farmer123',
      });
      localStorage.setItem('kisanqueue_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
    } catch (err) {
      console.error('Auto login fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('kisanqueue_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', userData);
      localStorage.setItem('kisanqueue_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = async (email, password) => {
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('kisanqueue_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoUsers,
        language,
        setLanguage,
        login,
        register,
        logout,
        switchPersona,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
