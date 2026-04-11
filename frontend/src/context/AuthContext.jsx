import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme]   = useState(() => localStorage.getItem('ct_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ct_theme', theme);
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem('ct_user');
    const token  = localStorage.getItem('ct_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('ct_token', token);
    localStorage.setItem('ct_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    setUser(null);
  };

  const toggleTheme = () =>
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};