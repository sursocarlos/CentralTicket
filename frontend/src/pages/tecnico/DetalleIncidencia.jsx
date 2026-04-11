import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ChevronDown } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const fmt     = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

function BadgeEstado({ e }) {
  const cls = { abierta: 'b-abierta', 'en proceso': 'b-en-proceso', resuelta: 'b-resuelta' };
  return <span className={`badge ${cls[e]||''}`}>{e}</span>;
}

export default function DetalleIncidencia() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [inc, setInc]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [tecnicos, setTecnicos] = useState([]);
  const [comentario, setComentario] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [changingState, setChangingState]   = useState(false);
  const commentsEndRef = useRef(null);

  const canEdit = user?.rol === 'admin' || user?.rol === 'tecnico';

  const load = async () => {
    try {
      const { data } = await api.get(`/incidencias/${id}`);
      setInc(data);
      if (user?.rol === 'admin') {
        const { data: tecs } = await api.get('/usuarios/tecnicos');
        setTecnicos(tecs);
      }
    } catch { navigate(-1); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [inc?.comentarios]);

  const handleEstado = async (e) => {
    setChangingState(true);
    try { await api.patch(`/incidencias/${id}/estado`, { estado: e.target.value }); load(); }
    catch {} finally { setChangingState(false); }
  };

  const handleAsignar = async (e) => {
    try { await api.patch(`/incidencias/${id}/asignar`, { id_tecnico: e.target.value || null }); load(); }
    catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setSendingComment(true);
    try {
      await api.post('/comentarios', { contenido: comentario, id_incidencia: Number(id) });
      setComentario(''); load();
    } catch {} finally { setSendingComment(false); }
  };

  const getBackPath = () => {
    if (user?.rol === 'admin')    return '/admin';
    if (user?.rol === 'tecnico')  return '/tecnico';
    return '/empleado/incidencias';
  };

  const initials = (nombre) => nombre?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>;
  if (!inc) return null;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(getBackPath())}>
          <ArrowLeft size={14} /> Volver
        </button>
      </div>

      <div className="detail-grid">
        {/* Columna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Cabecera del ticket */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: '0.4rem' }}>
                  #{String(inc.id).padStart(3, '0')}
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.3 }}>{inc.titulo}</h2>
              </div>
              <BadgeEstado e={inc.estado} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {inc.descripcion}
            </p>
          </div>

          {/* Comentarios */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <span className="section-title">Comentarios ({inc.comentarios?.length || 0})</span>
            </div>

            {inc.comentarios?.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Sin comentarios todavía. Sé el primero en responder.
              </p>
            )}

            <div className="comments-list" style={{ marginBottom: inc.comentarios?.length ? '1.25rem' : 0 }}>
              {inc.comentarios?.map(c => (
                <div key={c.id} className="comment-item">
                  <div className={`comment-avatar rol-${c.autor?.rol}`}>{initials(c.autor?.nombre)}</div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">{c.autor?.nombre || 'Usuario'}</span>
                      <span className={`badge b-${c.autor?.rol}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{c.autor?.rol}</span>
                      <span className="comment-time">{fmt(c.fecha_creacion)}</span>
                    </div>
                    <p className="comment-text">{c.contenido}</p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <textarea
                className="form-input form-textarea"
                placeholder="Escribe un comentario..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={3}
                style={{ flex: 1, minHeight: 70 }}
              />
              <button type="submit" className="btn btn-primary" disabled={sendingComment || !comentario.trim()} style={{ alignSelf: 'flex-end' }}>
                <Send size={15} /> {sendingComment ? '...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Cambiar estado (técnico y admin) */}
          {canEdit && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: '0.875rem' }}>Estado del ticket</div>
              <select className="form-select" value={inc.estado} onChange={handleEstado} disabled={changingState}>
                <option value="abierta">Abierta</option>
                <option value="en proceso">En proceso</option>
                <option value="resuelta">Resuelta</option>
              </select>
            </div>
          )}

          {/* Asignar técnico (solo admin) */}
          {user?.rol === 'admin' && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: '0.875rem' }}>Técnico asignado</div>
              <select className="form-select" value={inc.id_tecnico || ''} onChange={handleAsignar}>
                <option value="">Sin asignar</option>
                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          )}

          {/* Metadatos */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '0.875rem' }}>Información</div>
            <div>
              {[
                { label: 'Prioridad', value: <span className={`badge b-${inc.prioridad}`}>{inc.prioridad}</span> },
                { label: 'Categoría', value: inc.categoria
                    ? <span style={{ display:'flex', alignItems:'center', gap:6 }}><span className="cat-dot" style={{ background: inc.categoria.color }}/>{inc.categoria.nombre}</span>
                    : <span style={{ color:'var(--text-faint)' }}>Sin categoría</span> },
                { label: 'Creado por',    value: inc.creador?.nombre || '—' },
                { label: 'Técnico',       value: inc.tecnico?.nombre || <span style={{ color:'var(--text-faint)' }}>Sin asignar</span> },
                { label: 'Fecha apertura',value: fmtDate(inc.fecha_creacion) },
              ].map(({ label, value }) => (
                <div key={label} className="detail-row">
                  <span className="detail-label">{label}</span>
                  <span style={{ fontSize: '0.875rem' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}