// Es el componente que protege todas las rutas privadas de la app.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


// Un objeto que mapea cada rol con su página de inicio. 
// Se usa para redirigir a cada usuario a su panel correspondiente.
const HOME = { admin: '/admin', tecnico: '/tecnico', empleado: '/empleado' };

export default function ProtectedRoute({ children, rol }) {
  const { user, loading } = useAuth();

  //Mientras el AuthContext está comprobando si hay sesión guardada, muestra un spinner. 
  // Esto evita que la app redirija al login por error antes de haber terminado de leer el localStorage.
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // Si no hay usuario logueado, redirige al login.
  if (!user) return <Navigate to="/login" replace />;

  // Si la ruta requiere un rol concreto y el usuario no lo tiene, lo redirige a su propio panel.
  // Ejemplo: ejemplo si un empleado intenta entrar a /admin, lo manda a /empleado
  if (rol && user.rol !== rol) return <Navigate to={HOME[user.rol] || '/login'} replace />;

  // Al pasar todas las comprobaciones renderiza el contenido de la ruta
  return children;
}