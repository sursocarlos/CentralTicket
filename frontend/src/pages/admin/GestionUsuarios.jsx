import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, X, Pencil, UserX, UserCheck, Trash2, AlertTriangle, ClipboardList } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const EMPTY = { nombre: '', email: '', password: '', rol: 'empleado' };

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

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      setError('No se pudieron cargar los usuarios.');
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
  const openEdit = (u) => {
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol });
    setEditId(u.id); setFormError(''); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (editId) {
        const datos = { ...form };
        if (!datos.password) delete datos.password;
        await api.put(`/usuarios/${editId}`, datos);
        showSuccess('Usuario actualizado correctamente.');
      } else {
        await api.post('/auth/registro', form);
        showSuccess('Usuario creado correctamente.');
      }
      setModal(false); load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const u = confirm.usuario;
    try {
      await api.patch(`/usuarios/${u.id}/toggle`);
      showSuccess(`Usuario ${u.activo ? 'desactivado' : 'activado'} correctamente.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado.');
    } finally {
      setConfirm(null);
    }
  };

  const handleDelete = async () => {
    const u = confirm.usuario;
    try {
      await api.delete(`/usuarios/${u.id}`);
      showSuccess(`Usuario "${u.nombre}" eliminado permanentemente.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar.');
    } finally {
      setConfirm(null);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

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

      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer', marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer', marginBottom: '1rem' }}>{success}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : usuarios.length === 0 ? (
        <div className="card">
          <div className="empty-state"><UserPlus /><h3>Sin usuarios</h3><p>Crea el primer usuario del sistema.</p></div>
        </div>
      ) : (
        <>
          {/* Tabla — desktop */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Email</th><th>Rol</th>
                  <th>Estado</th><th>Alta</th><th>Acciones</th>
                </tr>
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
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => navigate(`/admin/usuarios/${u.id}/incidencias`)} title="Ver incidencias"><ClipboardList size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Editar"><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: u.activo ? 'var(--warning)' : 'var(--success)' }} onClick={() => setConfirm({ type: 'toggle', usuario: u })} title={u.activo ? 'Desactivar' : 'Activar'}>
                          {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm({ type: 'delete', usuario: u })} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — móvil */}
          <div className="mobile-card-list">
            {usuarios.map(u => (
              <div key={u.id} className="mobile-card" style={{ cursor: 'default' }}>
                <div className="mobile-card-header">
                  <div className="mobile-card-title">{u.nombre}</div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <span className={`badge b-${u.rol}`}>{u.rol}</span>
                    <span className={`badge ${u.activo ? 'b-activo' : 'b-inactivo'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{u.email}</div>
                <div className="mobile-card-meta">
                  <div className="mobile-card-meta-item">
                    <span className="mobile-card-meta-label">Alta</span>
                    <span className="mobile-card-meta-value">{fmt(u.fecha_creacion)}</span>
                  </div>
                  <div className="mobile-card-actions">
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => navigate(`/admin/usuarios/${u.id}/incidencias`)} title="Ver incidencias"><ClipboardList size={15} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Editar"><Pencil size={15} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: u.activo ? 'var(--warning)' : 'var(--success)' }} onClick={() => setConfirm({ type: 'toggle', usuario: u })} title={u.activo ? 'Desactivar' : 'Activar'}>
                      {u.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm({ type: 'delete', usuario: u })} title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal formulario — igual que antes */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar usuario' : 'Nuevo usuario'}</span>
              <button className="btn btn-ghost" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
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
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editId} minLength={editId ? 0 : 6} />
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
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm?.type === 'toggle' && (
        <ConfirmModal
          title={confirm.usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
          message={confirm.usuario.activo ? `¿Seguro que quieres desactivar a "${confirm.usuario.nombre}"? No podrá iniciar sesión.` : `¿Seguro que quieres activar a "${confirm.usuario.nombre}"? Recuperará el acceso.`}
          confirmLabel={confirm.usuario.activo ? 'Desactivar' : 'Activar'}
          confirmClass={confirm.usuario.activo ? 'btn-danger' : 'btn-primary'}
          onConfirm={handleToggle}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Eliminar usuario"
          message={`¿Seguro que quieres eliminar permanentemente a "${confirm.usuario.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar permanentemente"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Layout>
  );
}