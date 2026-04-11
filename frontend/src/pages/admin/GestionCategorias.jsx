import { useState, useEffect } from 'react';
import { Tag, Plus, X, Pencil, Trash2 } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const EMPTY = { nombre: '', color: '#38bdf8' };

export default function GestionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const load = async () => {
    try { const { data } = await api.get('/categorias'); setCategorias(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setError(''); setModal(true); };
  const openEdit   = (c) => { setForm({ nombre: c.nombre, color: c.color }); setEditId(c.id); setError(''); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId) await api.put(`/categorias/${editId}`, form);
      else        await api.post('/categorias', form);
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Desactivar la categoría "${nombre}"?`)) return;
    try { await api.delete(`/categorias/${id}`); load(); } catch {}
  };

  return (
    <Layout>
      <div className="page-header-row">
        <div>
          <h1>Categorías</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Clasifica las incidencias por tipo</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
          {categorias.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state"><Tag /><h3>Sin categorías</h3><p>Crea la primera para clasificar las incidencias.</p></div>
            </div>
          )}
          {categorias.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tag size={18} style={{ color: c.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.nombre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span className="cat-dot" style={{ background: c.color }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{c.color}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id, c.nombre)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar categoría' : 'Nueva categoría'}</span>
              <button className="btn btn-ghost" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej. Hardware, Software, Redes..." />
              </div>
              <div className="form-group">
                <label className="form-label">Color identificativo</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: 56, height: 42, padding: 4, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', cursor: 'pointer' }} />
                  <input className="form-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}