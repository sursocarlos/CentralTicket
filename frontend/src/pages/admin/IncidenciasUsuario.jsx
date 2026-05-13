import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Trash2, AlertTriangle, X } from 'lucide-react';
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

export default function IncidenciasUsuario() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario]         = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [confirm, setConfirm]         = useState(null);

  const load = async () => {
    try {
      const [uRes, iRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/incidencias', { params: { id_usuario: id } }),
      ]);
      const u = uRes.data.find(u => String(u.id) === String(id));
      setUsuario(u || null);
      setIncidencias(iRes.data);
    } catch {
      setError('No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/incidencias/${confirm.id}`);
      showSuccess(`Incidencia #${String(confirm.id).padStart(3, '0')} eliminada.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la incidencia.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/usuarios')}>
          <ArrowLeft size={14} /> Volver a usuarios
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <h1>
              {usuario
                ? <>Incidencias de <span style={{ color: 'var(--accent)' }}>{usuario.nombre}</span></>
                : 'Incidencias del usuario'
              }
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {incidencias.length} incidencia{incidencias.length !== 1 ? 's' : ''} encontrada{incidencias.length !== 1 ? 's' : ''}
              {usuario && (
                <span style={{ marginLeft: '0.5rem' }}>
                  · <span className={`badge ${usuario.activo ? 'b-activo' : 'b-inactivo'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span>
                  · <span className={`badge b-${usuario.rol}`}>{usuario.rol}</span>
                </span>
              )}
            </p>
          </div>

          {error   && <div className="alert alert-error"   onClick={() => setError('')}  style={{ cursor: 'pointer', marginBottom: '1rem' }}>{error}</div>}
          {success && <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer', marginBottom: '1rem' }}>{success}</div>}

          {incidencias.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <ClipboardList />
                <h3>Sin incidencias</h3>
                <p>Este usuario no ha creado ninguna incidencia todavía.</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Título</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Categoría</th>
                    <th>Técnico</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map(inc => (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/admin/incidencias/${inc.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>
                        #{String(inc.id).padStart(3, '0')}
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inc.titulo}
                        </div>
                      </td>
                      <td><BadgeEstado estado={inc.estado} /></td>
                      <td><BadgePrioridad p={inc.prioridad} /></td>
                      <td>
                        {inc.categoria
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="cat-dot" style={{ background: inc.categoria.color }} />
                              {inc.categoria.nombre}
                            </span>
                          : <span style={{ color: 'var(--text-faint)' }}>Sin categoría</span>
                        }
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {inc.tecnico?.nombre || <span style={{ color: 'var(--text-faint)' }}>Sin asignar</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {fmt(inc.fecha_creacion)}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setConfirm(inc)}
                          title="Eliminar incidencia"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

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