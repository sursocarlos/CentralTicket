import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, CheckCircle, AlertCircle, Users, Trash2, AlertTriangle, X } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const fmt = (d) => new Date(d).toLocaleDateString('es-ES', {
  day: '2-digit', month: 'short', year: 'numeric'
});

function BadgeEstado({ estado }) {
  const cls = { abierta: 'b-abierta', 'en proceso': 'b-en-proceso', resuelta: 'b-resuelta' };
  return <span className={`badge ${cls[estado] || ''}`}>{estado}</span>;
}

function BadgePrioridad({ p }) {
  return <span className={`badge b-${p}`}>{p}</span>;
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <span className="modal-title">{title}</span>
          </div>
          <button className="btn btn-ghost" onClick={onCancel}><X size={18} /></button>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
          {message}
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, abiertas: 0, proceso: 0, resueltas: 0 });
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [sRes, iRes] = await Promise.all([
        api.get('/incidencias/stats'),
        api.get('/incidencias'),
      ]);
      setStats(sRes.data);
      setIncidencias(iRes.data.slice(0, 10));
    } catch {
      setError('Error al cargar los datos del panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/incidencias/${confirm.id}`);
      showSuccess(`Incidencia #${String(confirm.id).padStart(3, '0')} eliminada correctamente.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la incidencia.');
    } finally {
      setConfirm(null);
    }
  };

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Panel de administración</h1>
        <p>Resumen general del sistema de incidencias</p>
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer', marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer', marginBottom: '1rem' }}>{success}</div>}

      <div className="stats-grid">
        {[
          { label: 'Total incidencias', value: stats.total, icon: Ticket, cls: 'si-blue' },
          { label: 'Abiertas', value: stats.abiertas, icon: AlertCircle, cls: 'si-purple' },
          { label: 'En proceso', value: stats.proceso, icon: Clock, cls: 'si-amber' },
          { label: 'Resueltas', value: stats.resueltas, icon: CheckCircle, cls: 'si-green' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${cls}`}><Icon size={22} /></div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <span className="section-title">Incidencias recientes</span>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/usuarios')}>
          <Users size={14} /> Gestionar usuarios
        </button>
      </div>

      {/* Tabla — visible en desktop */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Título</th><th>Estado</th><th>Prioridad</th>
              <th>Creador</th><th>Categoría</th><th>Fecha</th><th></th>
            </tr>
          </thead>
          <tbody>
            {incidencias.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  Sin incidencias
                </td>
              </tr>
            ) : incidencias.map(inc => (
              <tr key={inc.id} onClick={() => navigate(`/admin/incidencias/${inc.id}`)} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>#{String(inc.id).padStart(3, '0')}</td>
                <td style={{ fontWeight: 500, maxWidth: 220 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.titulo}</div>
                </td>
                <td><BadgeEstado estado={inc.estado} /></td>
                <td><BadgePrioridad p={inc.prioridad} /></td>
                <td style={{ color: 'var(--text-muted)' }}>{inc.creador?.nombre || '—'}</td>
                <td>
                  {inc.categoria
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="cat-dot" style={{ background: inc.categoria.color }} />
                      {inc.categoria.nombre}
                    </span>
                    : <span style={{ color: 'var(--text-faint)' }}>Sin categoría</span>
                  }
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{fmt(inc.fecha_creacion)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm(inc)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — visibles solo en móvil */}
      <div className="mobile-card-list">
        {incidencias.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Ticket />
              <h3>Sin incidencias</h3>
            </div>
          </div>
        ) : incidencias.map(inc => (
          <div key={inc.id} className="mobile-card" onClick={() => navigate(`/admin/incidencias/${inc.id}`)}>
            <div className="mobile-card-header">
              <div className="mobile-card-title">{inc.titulo}</div>
              <span className="mobile-card-id">#{String(inc.id).padStart(3, '0')}</span>
            </div>
            <div className="mobile-card-badges">
              <BadgeEstado estado={inc.estado} />
              <BadgePrioridad p={inc.prioridad} />
              {inc.categoria && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span className="cat-dot" style={{ background: inc.categoria.color }} />
                  {inc.categoria.nombre}
                </span>
              )}
            </div>
            <div className="mobile-card-meta">
              <div className="mobile-card-meta-item">
                <span className="mobile-card-meta-label">Creador</span>
                <span className="mobile-card-meta-value">{inc.creador?.nombre || '—'}</span>
              </div>
              <div className="mobile-card-meta-item" style={{ alignItems: 'flex-end' }}>
                <span className="mobile-card-meta-label">Fecha</span>
                <span className="mobile-card-meta-value">{fmt(inc.fecha_creacion)}</span>
              </div>
              <div className="mobile-card-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm(inc)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirm && (
        <ConfirmModal
          title="Eliminar incidencia"
          message={`¿Seguro que quieres eliminar "${confirm.titulo}"? Se borrarán también todos sus comentarios e historial.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Layout>
  );
}