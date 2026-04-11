import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HOME = { admin: '/admin', tecnico: '/tecnico', empleado: '/empleado' };

export default function ProtectedRoute({ children, rol }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (rol && user.rol !== rol) return <Navigate to={HOME[user.rol] || '/login'} replace />;
  return children;
}