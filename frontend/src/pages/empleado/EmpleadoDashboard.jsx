import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

export default function EmpleadoDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get('/incidencias').then(({ data }) => setIncidencias(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const abiertas  = incidencias.filter(i => i.estado === 'abierta').length;
  const proceso   = incidencias.filter(i => i.estado === 'en proceso').length;
  const resueltas = incidencias.filter(i => i.estado === 'resuelta').length;
  const recientes = incidencias.slice(0, 5);

  return (
    <Layout>
      <div className="page-header">
        <h1>Bienvenido, {user?.nombre?.split(' ')[0]}</h1>
        <p>Aquí tienes el resumen de tus incidencias</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total enviadas', value: incidencias.length, icon: Ticket,       cls: 'si-blue'   },
          { label: 'Abiertas',       value: abiertas,           icon: AlertCircle,  cls: 'si-purple' },
          { label: 'En proceso',     value: proceso,            icon: Clock,        cls: 'si-amber'  },
          { label: 'Resueltas',      value: resueltas,          icon: CheckCircle,  cls: 'si-green'  },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${cls}`}><Icon size={22} /></div>
            <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* CTA crear */}
        <div className="card" style={{ flex: '1', minWidth: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '0.875rem', padding: '2rem', border: '1px dashed var(--border-md)', background: 'var(--accent-muted)' }}>
          <PlusCircle size={32} style={{ color: 'var(--accent)', opacity: 0.8 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>¿Tienes un problema?</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Abre una nueva incidencia y te ayudaremos</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/empleado/crear')}>
            <PlusCircle size={15} /> Crear incidencia
          </button>
        </div>

        {/* Recientes */}
        <div className="card" style={{ flex: '2', minWidth: 320 }}>
          <div className="section-header">
            <span className="section-title">Incidencias recientes</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/empleado/incidencias')}>Ver todas</button>
          </div>

          {loading ? <div className="loading-center"><div className="spinner" /></div>
          : recientes.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Ticket /><h3>Sin incidencias</h3><p>Todavía no has abierto ningún ticket.</p>
            </div>
          ) : (
            <div className="ticket-list">
              {recientes.map(inc => (
                <div key={inc.id} className="ticket-row" onClick={() => navigate(`/empleado/incidencias/${inc.id}`)}>
                  <span className="ticket-num">#{String(inc.id).padStart(3,'0')}</span>
                  <div className="ticket-info">
                    <div className="ticket-title">{inc.titulo}</div>
                    <div className="ticket-sub">{fmt(inc.fecha_creacion)}</div>
                  </div>
                  <div className="ticket-badges">
                    <span className={`badge b-${inc.estado.replace(' ', '-')}`}>{inc.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}