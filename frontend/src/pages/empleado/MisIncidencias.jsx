import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MisIncidencias() {
  const navigate = useNavigate();
  const [incidencias, setIncidencias]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const params = {};
        if (filtroEstado) params.estado = filtroEstado;
        const { data } = await api.get('/incidencias', { params });
        setIncidencias(data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [filtroEstado]);

  return (
    <Layout>
      <div className="page-header-row">
        <div>
          <h1>Mis incidencias</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Historial de todos tus tickets</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/empleado/crear')}>
          <PlusCircle size={16} /> Nueva incidencia
        </button>
      </div>

      <div className="filters-bar">
        {['', 'abierta', 'en proceso', 'resuelta'].map(v => (
          <button
            key={v}
            className={`btn btn-sm ${filtroEstado === v ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroEstado(v)}
          >
            {v === '' ? 'Todas' : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {incidencias.length} resultado{incidencias.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : incidencias.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ClipboardList />
            <h3>{filtroEstado ? `Sin incidencias "${filtroEstado}"` : 'Sin incidencias'}</h3>
            <p>Cuando crees una incidencia aparecerá aquí.</p>
            {!filtroEstado && <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/empleado/crear')}>Crear primera incidencia</button>}
          </div>
        </div>
      ) : (
        <div className="ticket-list">
          {incidencias.map(inc => (
            <div key={inc.id} className="ticket-row" onClick={() => navigate(`/empleado/incidencias/${inc.id}`)}>
              <span className="ticket-num">#{String(inc.id).padStart(3,'0')}</span>
              <div className="ticket-info">
                <div className="ticket-title">{inc.titulo}</div>
                <div className="ticket-sub">
                  {fmt(inc.fecha_creacion)}
                  {inc.categoria && <> · <span style={{ color: inc.categoria.color }}>{inc.categoria.nombre}</span></>}
                  {inc.tecnico && <> · Técnico: {inc.tecnico.nombre}</>}
                </div>
              </div>
              <div className="ticket-badges">
                <span className={`badge b-${inc.prioridad}`}>{inc.prioridad}</span>
                <span className={`badge b-${inc.estado.replace(' ', '-')}`}>{inc.estado}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}