import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('fw_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (jwt) => {
    if (!jwt) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.me(jwt);
      setUser(data.user);
    } catch {
      localStorage.removeItem('fw_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe(token);
  }, [token, fetchMe]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('fw_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    localStorage.setItem('fw_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('fw_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
