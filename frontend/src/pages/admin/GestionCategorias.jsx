import { useState, useEffect } from 'react';
import { Tag, Plus, X, Pencil, Trash2, AlertTriangle, EyeOff, Eye } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const EMPTY = { nombre: '', color: '#38bdf8' };

function ConfirmModal({ title, message, confirmLabel, confirmClass = 'btn-danger', onConfirm, onCancel }) {
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
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function GestionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/categorias/todas');
      setCategorias(data);
    } catch {
      setError('No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openCreate = () => { setForm(EMPTY); setEditId(null); setFormError(''); setModal(true); };
  const openEdit = (c) => {
    setForm({ nombre: c.nombre, color: c.color });
    setEditId(c.id); setFormError(''); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (editId) await api.put(`/categorias/${editId}`, form);
      else await api.post('/categorias', form);
      showSuccess(editId ? 'Categoría actualizada.' : 'Categoría creada.');
      setModal(false); load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const c = confirm.categoria;
    try {
      await api.patch(`/categorias/${c.id}/toggle`);
      showSuccess(`Categoría "${c.nombre}" ${c.activa ? 'desactivada' : 'activada'}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado.');
    } finally {
      setConfirm(null);
    }
  };

  const handleDelete = async () => {
    const c = confirm.categoria;
    try {
      await api.delete(`/categorias/${c.id}`);
      showSuccess(`Categoría "${c.nombre}" eliminada permanentemente.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <Layout>
      <div className="page-header-row">
        <div>
          <h1>Categorías</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Clasifica las incidencias por tipo
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>{success}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : categorias.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Tag /><h3>Sin categorías</h3>
            <p>Crea la primera para clasificar las incidencias.</p>
          </div>
        </div>
      ) : (
        <div className="cat-grid">
          {categorias.map(c => (
            <div
              key={c.id}
              className="cat-card"
              style={{ opacity: c.activa ? 1 : 0.55 }}
            >
              {/* Fila superior: icono + nombre */}
              <div className="cat-card-top">
                <div
                  className="cat-card-icon"
                  style={{
                    background: c.color + '22',
                    border: `1px solid ${c.color}44`,
                  }}
                >
                  <Tag size={18} style={{ color: c.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cat-card-name">{c.nombre}</div>
                  {!c.activa && (
                    <span className="badge b-inactivo" style={{ fontSize: '0.62rem', marginTop: '0.2rem', display: 'inline-block' }}>
                      Inactiva
                    </span>
                  )}
                </div>
              </div>

              {/* Fila inferior: color + acciones */}
              <div className="cat-card-bottom">
                <div className="cat-card-color">
                  <span className="cat-card-color-dot" style={{ background: c.color }} />
                  <span className="cat-card-color-hex">{c.color}</span>
                </div>
                <div className="cat-card-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEdit(c)}
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: c.activa ? 'var(--warning)' : 'var(--success)' }}
                    onClick={() => setConfirm({ type: 'toggle', categoria: c })}
                    title={c.activa ? 'Desactivar' : 'Activar'}
                  >
                    {c.activa ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setConfirm({ type: 'delete', categoria: c })}
                    title="Eliminar permanentemente"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar categoría' : 'Nueva categoría'}</span>
              <button className="btn btn-ghost" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Ej. Hardware, Software, Redes..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color identificativo</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    style={{ width: 56, height: 42, padding: 4, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', cursor: 'pointer' }}
                  />
                  <input
                    className="form-input"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm?.type === 'toggle' && (
        <ConfirmModal
          title={confirm.categoria.activa ? 'Desactivar categoría' : 'Activar categoría'}
          message={
            confirm.categoria.activa
              ? `¿Seguro que quieres desactivar "${confirm.categoria.nombre}"? No aparecerá al crear nuevas incidencias.`
              : `¿Seguro que quieres activar "${confirm.categoria.nombre}"? Volverá a estar disponible.`
          }
          confirmLabel={confirm.categoria.activa ? 'Desactivar' : 'Activar'}
          confirmClass={confirm.categoria.activa ? 'btn-danger' : 'btn-primary'}
          onConfirm={handleToggle}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Eliminar categoría"
          message={`¿Seguro que quieres eliminar permanentemente "${confirm.categoria.nombre}"? Las incidencias que la usen quedarán sin categoría.`}
          confirmLabel="Eliminar permanentemente"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Layout>
  );
}