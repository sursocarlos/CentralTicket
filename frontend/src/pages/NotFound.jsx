import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="loading-page" style={{ gap: '0.75rem' }}>
      <Ticket size={40} style={{ opacity: 0.3 }} />
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Página no encontrada</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>La ruta que buscas no existe.</p>
      <button className="btn btn-primary btn-sm" onClick={() => navigate(-1)}>Volver</button>
    </div>
  );
}