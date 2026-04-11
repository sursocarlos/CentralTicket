import { useState, useEffect } from 'react';
import { UserPlus, X, Pencil, UserX } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const EMPTY = { nombre: '', email: '', password: '', rol: 'empleado' };

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState(false);
  const [form, setForm]        = useState(EMPTY);
  const [editId, setEditId]    = useState(null);
  const [saving, setSaving]    = useState(false);
  const [error, setError]      = useState('');

  const load = async () => {
    try { const { data } = await api.get('/usuarios'); setUsuarios(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setError(''); setModal(true); };
  const openEdit   = (u) => {
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol });
    setEditId(u.id); setError(''); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId) {
        const datos = { ...form };
        if (!datos.password) delete datos.password;
        await api.put(`/usuarios/${editId}`, datos);
      } else {
        await api.post('/auth/registro', form);
      }
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const toggleActivo = async (u) => {
    if (!confirm(`¿${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre}?`)) return;
    try { await api.put(`/usuarios/${u.id}`, { activo: !u.activo }); load(); } catch {}
  };

  const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Layout>
      <div className="page-header-row">
        <div>
          <h1>Usuarios</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Gestión de cuentas del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Alta</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><span className={`badge b-${u.rol}`}>{u.rol}</span></td>
                  <td><span className={`badge ${u.activo ? 'b-activo' : 'b-inactivo'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{fmt(u.fecha_creacion)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Editar"><Pencil size={14} /></button>
                      <button className={`btn btn-ghost btn-sm ${!u.activo ? '' : ''}`} style={{ color: u.activo ? 'var(--danger)' : 'var(--success)' }}
                        onClick={() => toggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'}>
                        <UserX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar usuario' : 'Nuevo usuario'}</span>
              <button className="btn btn-ghost" onClick={() => setModal(false)}><X size={18} /></button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{editId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                <input className="form-input" type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editId} minLength={editId ? 0 : 6} />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-select" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                  <option value="empleado">Empleado</option>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Admin</option>
                </select>
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
    </Layout>
  );
}