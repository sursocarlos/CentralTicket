import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

function BadgeEstado({ e }) {
  const cls = { abierta: 'b-abierta', 'en proceso': 'b-en-proceso', resuelta: 'b-resuelta' };
  return <span className={`badge ${cls[e]||''}`}>{e}</span>;
}
function BadgePrioridad({ p }) {
  return <span className={`badge b-${p}`}>{p}</span>;
}
const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

export default function TecnicoDashboard() {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtroEstado, setFiltroEstado]       = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const params = {};
        if (filtroEstado)    params.estado    = filtroEstado;
        if (filtroPrioridad) params.prioridad = filtroPrioridad;
        const { data } = await api.get('/incidencias', { params });
        setIncidencias(data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [filtroEstado, filtroPrioridad]);

  return (
    <Layout>
      <div className="page-header">
        <h1>Mis incidencias</h1>
        <p>Gestiona y resuelve los tickets asignados</p>
      </div>

      <div className="filters-bar">
        <select className="filter-sel" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="abierta">Abierta</option>
          <option value="en proceso">En proceso</option>
          <option value="resuelta">Resuelta</option>
        </select>
        <select className="filter-sel" value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}>
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {incidencias.length} incidencias
        </span>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : incidencias.length === 0 ? (
        <div className="card"><div className="empty-state"><ClipboardList /><h3>Sin incidencias</h3><p>No hay tickets que coincidan con los filtros seleccionados.</p></div></div>
      ) : (
        <div className="ticket-list">
          {incidencias.map(inc => (
            <div key={inc.id} className="ticket-row" onClick={() => navigate(`/tecnico/incidencias/${inc.id}`)}>
              <span className="ticket-num">#{String(inc.id).padStart(3,'0')}</span>
              <div className="ticket-info">
                <div className="ticket-title">{inc.titulo}</div>
                <div className="ticket-sub">
                  {inc.creador?.nombre || 'Desconocido'} · {fmt(inc.fecha_creacion)}
                  {inc.categoria && <> · <span style={{ color: inc.categoria.color }}>{inc.categoria.nombre}</span></>}
                </div>
              </div>
              <div className="ticket-badges">
                <BadgePrioridad p={inc.prioridad} />
                <BadgeEstado e={inc.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}