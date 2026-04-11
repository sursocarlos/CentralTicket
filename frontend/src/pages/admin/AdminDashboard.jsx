import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

function BadgeEstado({ estado }) {
  const cls = { abierta: 'b-abierta', 'en proceso': 'b-en-proceso', resuelta: 'b-resuelta' };
  return <span className={`badge ${cls[estado] || ''}`}>{estado}</span>;
}
function BadgePrioridad({ p }) {
  const cls = { alta: 'b-alta', media: 'b-media', baja: 'b-baja' };
  return <span className={`badge ${cls[p] || ''}`}>{p}</span>;
}

export default function AdminDashboard() {
  const [stats, setStats]           = useState({ total: 0, abiertas: 0, proceso: 0, resueltas: 0 });
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, iRes] = await Promise.all([
          api.get('/incidencias/stats'),
          api.get('/incidencias'),
        ]);
        setStats(sRes.data);
        setIncidencias(iRes.data.slice(0, 10));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Panel de administración</h1>
        <p>Resumen general del sistema de incidencias</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total incidencias', value: stats.total,    icon: Ticket,       cls: 'si-blue'   },
          { label: 'Abiertas',          value: stats.abiertas, icon: AlertCircle,  cls: 'si-purple' },
          { label: 'En proceso',        value: stats.proceso,  icon: Clock,        cls: 'si-amber'  },
          { label: 'Resueltas',         value: stats.resueltas,icon: CheckCircle,  cls: 'si-green'  },
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

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Título</th><th>Estado</th><th>Prioridad</th>
              <th>Creador</th><th>Categoría</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {incidencias.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin incidencias</td></tr>
            ) : incidencias.map(inc => (
              <tr key={inc.id} onClick={() => navigate(`/admin/incidencias/${inc.id}`)}>
                <td style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>#{String(inc.id).padStart(3,'0')}</td>
                <td style={{ fontWeight: 500, maxWidth: 220 }}><div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inc.titulo}</div></td>
                <td><BadgeEstado estado={inc.estado} /></td>
                <td><BadgePrioridad p={inc.prioridad} /></td>
                <td style={{ color: 'var(--text-muted)' }}>{inc.creador?.nombre || '—'}</td>
                <td>
                  {inc.categoria
                    ? <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span className="cat-dot" style={{ background: inc.categoria.color }} />
                        {inc.categoria.nombre}
                      </span>
                    : <span style={{ color:'var(--text-faint)' }}>Sin categoría</span>}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize:'0.78rem' }}>{fmt(inc.fecha_creacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}