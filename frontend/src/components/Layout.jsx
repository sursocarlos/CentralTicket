// Rederiza la  (Barra lateral con opciones)
// Childer es la pagina que se muestra Ejemplo: AdminDashboard, DetalleIncidencia

import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}