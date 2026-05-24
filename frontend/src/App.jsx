// Define la estructura y las rutas de la app:
// Envuelve todo en AuthProvider para que la sesión esté disponible globalmente
// Todas las rutas privadas están protegidas con ProtectedRoute y su rol requerido

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminDashboard    from './pages/admin/AdminDashboard';
import GestionUsuarios   from './pages/admin/GestionUsuarios';
import GestionCategorias from './pages/admin/GestionCategorias';
import IncidenciasUsuario from './pages/admin/IncidenciasUsuario';
import TecnicoDashboard  from './pages/tecnico/TecnicoDashboard';
import DetalleIncidencia from './pages/tecnico/DetalleIncidencia';
import EmpleadoDashboard from './pages/empleado/EmpleadoDashboard';
import CrearIncidencia   from './pages/empleado/CrearIncidencia';
import MisIncidencias    from './pages/empleado/MisIncidencias';

function AppRoutes() {
  return (
    // RUTAS ESPECIALES:
    // La ruta /login es la unica ruta pública, sin ProtectedRoute
    // La ruta / redirige automáticamente al login
    // La ruta * captura cualquier URL que no exista y muestra el 404

    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <ProtectedRoute rol="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute rol="admin"><GestionUsuarios /></ProtectedRoute>} />
      <Route path="/admin/categorias" element={
        <ProtectedRoute rol="admin"><GestionCategorias /></ProtectedRoute>} />
      <Route path="/admin/incidencias/:id" element={
        <ProtectedRoute rol="admin"><DetalleIncidencia /></ProtectedRoute>} />
      <Route path="/admin/usuarios/:id/incidencias" element={
        <ProtectedRoute rol="admin"><IncidenciasUsuario /></ProtectedRoute>} />

      <Route path="/tecnico" element={
        <ProtectedRoute rol="tecnico"><TecnicoDashboard /></ProtectedRoute>} />
      <Route path="/tecnico/incidencias/:id" element={
        <ProtectedRoute rol="tecnico"><DetalleIncidencia /></ProtectedRoute>} />

      <Route path="/empleado" element={
        <ProtectedRoute rol="empleado"><EmpleadoDashboard /></ProtectedRoute>} />
      <Route path="/empleado/crear" element={
        <ProtectedRoute rol="empleado"><CrearIncidencia /></ProtectedRoute>} />
      <Route path="/empleado/incidencias" element={
        <ProtectedRoute rol="empleado"><MisIncidencias /></ProtectedRoute>} />
      <Route path="/empleado/incidencias/:id" element={
        <ProtectedRoute rol="empleado"><DetalleIncidencia /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    // AuthProvider hace que el contexto de sesión esté disponible en toda la app
    // BrowserRouter activa React Router para gestionar la navegación
    // AppRoutes define todas las rutas
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}