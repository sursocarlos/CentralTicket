import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Send } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

export default function CrearIncidencia() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'media', id_categoria: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/categorias').then(({ data }) => setCategorias(data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/incidencias', {
        ...form,
        id_categoria: form.id_categoria || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la incidencia');
    } finally { setSaving(false); }
  };

  if (success) return (
    <Layout>
      <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'var(--success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--success)' }}>
          <CheckCircle size={30} />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Incidencia enviada</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Tu incidencia ha sido registrada correctamente. Un técnico la revisará pronto.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/empleado/incidencias')}>Ver mis incidencias</button>
          <button className="btn btn-primary" onClick={() => { setSuccess(false); setForm({ titulo: '', descripcion: '', prioridad: 'media', id_categoria: '' }); }}>
            Crear otra
          </button>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ maxWidth: 600 }}>
        <div className="page-header">
          <h1>Nueva incidencia</h1>
          <p>Describe el problema con el mayor detalle posible</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                placeholder="Resumen breve del problema"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                required minLength={5}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción *</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Explica el problema en detalle: qué ocurre, cuándo empezó, qué has intentado..."
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                required rows={5}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select className="form-select" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                  <option value="baja">Baja — No urgente</option>
                  <option value="media">Media — Normal</option>
                  <option value="alta">Alta — Urgente</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.id_categoria} onChange={e => setForm({ ...form, id_categoria: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/empleado')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Send size={15} /> {saving ? 'Enviando...' : 'Enviar incidencia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}