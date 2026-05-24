// Guarda los datos del usuario logueado y los hace accesibles desde cualquier componente de la app

import { createContext, useContext, useState, useEffect } from 'react';


// Creamos un "contexto" vacio , es como crear un canal de comunicación donde vamos a ir metiendo todos los datos.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Guardamos los datos del usuario logueado,
  // si es null significa que usuario no ha iniciado sesión
  const [user, setUser]     = useState(null);

  // Indica si todavía se está comprobando si hay sesión guardada. 
  const [loading, setLoading] = useState(true);

  // El tema oscuro/claro. Se inicializa leyendo el localStorage, así se recuerda entre sesiones
  const [theme, setTheme]   = useState(() => localStorage.getItem('ct_theme') || 'dark');


  // Cuando cambiamos de tema lo guardamos en el localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ct_theme', theme);
  }, [theme]);

  // Solo se ejecuta al cargar la aplicación por primera vez.
  // Comprueba si hay sesión activa en el localStorage y si la hay restaura el usuario sin necesidad de hacer login de nuevo.
  useEffect(() => {
    const stored = localStorage.getItem('ct_user');
    const token  = localStorage.getItem('ct_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    // El [] vacío significa que solo se ejecuta al montar el componente. 
    // Cuando termina pone loading a false para que la app empiece a renderizar.
    setLoading(false);
  }, []);


  // Cuando el usuario hace login correctamente, guarda el token y los datos en localStorage
  const login = (userData, token) => {
    localStorage.setItem('ct_token', token);
    localStorage.setItem('ct_user', JSON.stringify(userData));
    setUser(userData);
  };

  // Cuando el usuario cierra sesión limpia el localStorage y pone user a null.
  const logout = () => {
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    setUser(null);
  };

  const toggleTheme = () =>
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    // El Provider envuelve toda la app y expone esas variables y funciones a cualquier componente hijo.
    <AuthContext.Provider value={{ user, loading, login, logout, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

// Simplifica el acceso al contexto. 
// En cualquier componente puedes hacer 
// const { user, login, logout } = useAuth() y tener acceso a todo. 
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};