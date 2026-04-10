import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FolderOpen,
  MessageSquare,
  Settings,
  Users,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Ticket,
  UserCircle,
  Wrench,
  XCircle,
} from "lucide-react";
import axios from "axios";
import "./Login.css";

const API_URL = "http://localhost:3000/api";

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const apiGet = (url, token, params = {}) =>
  axios.get(`${API_URL}${url}`, { ...getAuthHeaders(token), params });

const apiPost = (url, token, body) =>
  axios.post(`${API_URL}${url}`, body, getAuthHeaders(token));

const apiPut = (url, token, body) =>
  axios.put(`${API_URL}${url}`, body, getAuthHeaders(token));

const apiPatch = (url, token, body) =>
  axios.patch(`${API_URL}${url}`, body, getAuthHeaders(token));

const roleIcon = {
  admin: <ShieldCheck size={18} />,
  tecnico: <Wrench size={18} />,
  empleado: <UserCircle size={18} />,
};

function TicketDetail({ token, ticket, onClose }) {
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(ticket);

  const recargarDetalle = async () => {
    try {
      const res = await apiGet(`/incidencias/${ticket.id}`, token);
      setDetalle(res.data);
    } catch (_e) {
      setError("No se pudo cargar el detalle del ticket.");
    }
  };

  useEffect(() => {
    recargarDetalle();
  }, [ticket.id]);

  const crearComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiPost("/comentarios", token, {
        contenido: comentario,
        id_incidencia: ticket.id,
      });
      setComentario("");
      await recargarDetalle();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar el comentario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="section-title"><MessageSquare size={17} /> Ticket #{detalle.id} - {detalle.titulo}</h3>
        <button className="secondary-btn" onClick={onClose}>Cerrar</button>
      </div>
      <p><strong>Estado:</strong> {detalle.estado} | <strong>Prioridad:</strong> {detalle.prioridad}</p>
      <p>{detalle.descripcion}</p>
      <h4>Comentarios</h4>
      <div className="comments-box">
        {(detalle.comentarios || []).map((c) => (
          <article key={c.id} className="comment-item">
            <strong>{c.autor?.nombre || "Usuario"}</strong>: {c.contenido}
          </article>
        ))}
        {!detalle.comentarios?.length && <p>No hay comentarios todavía.</p>}
      </div>

      <form onSubmit={crearComentario} className="inline-form">
        <input
          className="simple-input"
          placeholder="Escribe un comentario..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        <button className="primary-btn compact-btn" disabled={loading}>
          {loading ? <Loader2 size={14} className="spin" /> : "Enviar"}
        </button>
      </form>
      {error && <p className="text-error">{error}</p>}
    </section>
  );
}

function DashboardEmpleado({ token, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "media",
    id_categoria: "",
    url_adjunto: "",
  });

  const cargarDatos = async () => {
    try {
      const [resTickets, resCategorias] = await Promise.all([
        apiGet("/incidencias", token, { estado, prioridad }),
        apiGet("/categorias", token),
      ]);
      setTickets(resTickets.data);
      setCategorias(resCategorias.data);
    } catch (_e) {
      setError("No se pudieron cargar las incidencias.");
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [estado, prioridad]);

  const crearTicket = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiPost("/incidencias", token, {
        ...form,
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
      });
      setForm({
        titulo: "",
        descripcion: "",
        prioridad: "media",
        id_categoria: "",
        url_adjunto: "",
      });
      await cargarDatos();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo crear la incidencia.");
    }
  };

  return (
    <div className="dashboard-content">
      <section className="panel">
        <h2 className="section-title"><Ticket size={18} /> Crear incidencia</h2>
        <form onSubmit={crearTicket} className="grid-form">
          <input className="simple-input" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <textarea className="simple-input" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <select className="simple-input" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
          <select className="simple-input" value={form.id_categoria} onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input className="simple-input" placeholder="URL adjunto (opcional)" value={form.url_adjunto} onChange={(e) => setForm({ ...form, url_adjunto: e.target.value })} />
          <button className="primary-btn compact-btn">Crear ticket</button>
        </form>
      </section>

      <section className="panel">
        <h2 className="section-title"><ClipboardList size={18} /> Mis incidencias ({usuario.nombre})</h2>
        <div className="inline-form">
          <select className="simple-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en proceso">En proceso</option>
            <option value="resuelta">Resuelta</option>
          </select>
          <select className="simple-input" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="simple-table">
            <thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Prioridad</th><th></th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td><td>{t.titulo}</td><td>{t.estado}</td><td>{t.prioridad}</td>
                  <td><button className="secondary-btn" onClick={() => setSelected(t)}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <TicketDetail token={token} ticket={selected} onClose={() => setSelected(null)} />}
      {error && <p className="text-error">{error}</p>}
    </div>
  );
}

function DashboardTecnico({ token, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const cargarTickets = async () => {
    try {
      const res = await apiGet("/incidencias", token);
      const asignadas = res.data.filter((t) => t.id_tecnico === usuario.id);
      setTickets(asignadas);
    } catch (_e) {
      setError("No se pudieron cargar los tickets asignados.");
    }
  };

  useEffect(() => {
    cargarTickets();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await apiPatch(`/incidencias/${id}/estado`, token, { estado });
      await cargarTickets();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo actualizar el estado.");
    }
  };

  return (
    <div className="dashboard-content">
      <section className="panel">
        <h2 className="section-title"><Wrench size={18} /> Tickets asignados</h2>
        <div className="table-wrap">
          <table className="simple-table">
            <thead><tr><th>ID</th><th>Título</th><th>Prioridad</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td><td>{t.titulo}</td><td>{t.prioridad}</td>
                  <td>
                    <select className="simple-input" value={t.estado} onChange={(e) => cambiarEstado(t.id, e.target.value)}>
                      <option value="abierta">Abierta</option>
                      <option value="en proceso">En proceso</option>
                      <option value="resuelta">Resuelta</option>
                    </select>
                  </td>
                  <td><button className="secondary-btn" onClick={() => setSelected(t)}>Abrir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {selected && <TicketDetail token={token} ticket={selected} onClose={() => setSelected(null)} />}
      {error && <p className="text-error">{error}</p>}
    </div>
  );
}

function DashboardAdmin({ token }) {
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [error, setError] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", color: "#6366f1" });

  const cargarTodo = async () => {
    try {
      const [s, u, c, i, t] = await Promise.all([
        apiGet("/incidencias/stats", token),
        apiGet("/usuarios", token),
        apiGet("/categorias", token),
        apiGet("/incidencias", token),
        apiGet("/usuarios/tecnicos", token),
      ]);
      setStats(s.data);
      setUsuarios(u.data);
      setCategorias(c.data);
      setIncidencias(i.data);
      setTecnicos(t.data);
    } catch (_e) {
      setError("No se pudieron cargar los datos de administración.");
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const guardarUsuario = async (u) => {
    try {
      await apiPut(`/usuarios/${u.id}`, token, { rol: u.rol, activo: u.activo });
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo actualizar usuario.");
    }
  };

  const crearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.nombre.trim()) return;
    try {
      await apiPost("/categorias", token, nuevaCategoria);
      setNuevaCategoria({ nombre: "", color: "#6366f1" });
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo crear la categoría.");
    }
  };

  const asignarTecnico = async (idTicket, idTecnico) => {
    try {
      await apiPatch(`/incidencias/${idTicket}/asignar`, token, { id_tecnico: Number(idTecnico) || null });
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo asignar el técnico.");
    }
  };

  return (
    <div className="dashboard-content">
      <section className="panel">
        <h2 className="section-title"><BarChart3 size={18} /> Estadísticas</h2>
        <div className="kpi-grid">
          <article className="kpi-item"><strong>Total</strong><span>{stats?.total ?? "-"}</span></article>
          <article className="kpi-item"><strong>Abiertas</strong><span>{stats?.abiertas ?? "-"}</span></article>
          <article className="kpi-item"><strong>En proceso</strong><span>{stats?.proceso ?? "-"}</span></article>
          <article className="kpi-item"><strong>Resueltas</strong><span>{stats?.resueltas ?? "-"}</span></article>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title"><Users size={18} /> Gestión de usuarios</h2>
        <div className="table-wrap">
          <table className="simple-table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th></th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="simple-input" value={u.rol} onChange={(e) => setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, rol: e.target.value } : x))}>
                      <option value="admin">Admin</option>
                      <option value="tecnico">Técnico</option>
                      <option value="empleado">Empleado</option>
                    </select>
                  </td>
                  <td>
                    <input type="checkbox" checked={u.activo} onChange={(e) => setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: e.target.checked } : x))} />
                  </td>
                  <td><button className="secondary-btn" onClick={() => guardarUsuario(u)}>Guardar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title"><FolderOpen size={18} /> Categorías</h2>
        <form onSubmit={crearCategoria} className="inline-form">
          <input className="simple-input" placeholder="Nombre de categoría" value={nuevaCategoria.nombre} onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })} />
          <input className="simple-input" type="color" value={nuevaCategoria.color} onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, color: e.target.value })} />
          <button className="primary-btn compact-btn">Crear</button>
        </form>
        <ul className="simple-list">
          {categorias.map((c) => <li key={c.id}>{c.nombre}</li>)}
        </ul>
      </section>

      <section className="panel">
        <h2 className="section-title"><Settings size={18} /> Reasignar tickets</h2>
        <div className="table-wrap">
          <table className="simple-table">
            <thead><tr><th>ID</th><th>Título</th><th>Técnico</th></tr></thead>
            <tbody>
              {incidencias.map((i) => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td>{i.titulo}</td>
                  <td>
                    <select
                      className="simple-input"
                      value={i.id_tecnico || ""}
                      onChange={(e) => asignarTecnico(i.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="text-error">{error}</p>}
    </div>
  );
}

function Login({ isDark, setIsDark, onLogin }) {
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Por favor, introduce tu correo corporativo.");
    if (!isValidEmail(email)) return setError("El formato del correo no es válido.");
    if (!password.trim()) return setError("Por favor, introduce tu contraseña.");

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { usuario, token } = res.data;
      if (usuario.rol !== role) {
        setError(`Este usuario no es ${role}. Selecciona el rol correcto.`);
        return;
      }
      onLogin({ usuario, token });
    } catch (err) {
      setError(err.response?.data?.error || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <button className="theme-toggle" onClick={() => setIsDark(!isDark)} aria-label="Cambiar tema">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="login-header">
          <div className="login-icon"><Ticket size={40} strokeWidth={1.5} /></div>
          <h2 className="login-title">CentralTicket</h2>
          <p className="login-subtitle">Accede a tu panel de gestión</p>
        </div>
        <div className="role-selector">
          {["admin", "tecnico", "empleado"].map((r) => (
            <button key={r} className={`role-btn ${role === r ? "active" : ""}`} onClick={() => { setRole(r); setError(""); }}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={handleLogin} noValidate>
          <div className="input-group">
            <label htmlFor="email" className="sr-only">Correo corporativo</label>
            <Mail className="input-icon" aria-hidden="true" />
            <input id="email" type="email" className="login-input" placeholder="Correo corporativo" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
          </div>
          <div className="input-group">
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <Lock className="input-icon" aria-hidden="true" />
            <input id="password" type={showPass ? "text" : "password"} className="login-input login-input--password" placeholder="Contraseña" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
            <button type="button" className="eye-toggle" onClick={() => setShowPass(!showPass)} aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && (
            <div className="login-error" role="alert">
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "3px", marginRight: "0px" }} />
              <span>{error}</span>
            </div>
          )}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Entrando...</> : `Entrar como ${role}`}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppShell({ session, isDark, setIsDark, onLogout }) {
  const { usuario, token } = session;
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          {roleIcon[usuario.rol]} <strong>Panel {usuario.rol}</strong>
        </div>
        <div className="inline-form">
          <span>{usuario.nombre}</span>
          <button
            className="theme-toggle app-theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label="Cambiar tema"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="secondary-btn danger-btn" onClick={onLogout}>Salir</button>
        </div>
      </header>
      {usuario.rol === "empleado" && <DashboardEmpleado token={token} usuario={usuario} />}
      {usuario.rol === "tecnico" && <DashboardTecnico token={token} usuario={usuario} />}
      {usuario.rol === "admin" && <DashboardAdmin token={token} />}
    </div>
  );
}

function App() {
  const [status, setStatus] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    axios.get(`${API_URL}/status`)
      .then((res) => setStatus({ ok: true, msg: res.data.message }))
      .catch(() => setStatus({ ok: false, msg: "Backend desconectado" }));

    const saved = localStorage.getItem("centralticket-session");
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (_e) {
        localStorage.removeItem("centralticket-session");
      }
    }
  }, []);

  const handleLogin = (newSession) => {
    setSession(newSession);
    localStorage.setItem("centralticket-session", JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("centralticket-session");
  };

  return (
    <>
      {!session && (
        <div className={`status-bar ${status ? (status.ok ? "status-ok" : "status-error") : "status-loading"}`}>
          {!status && <><Loader2 size={13} className="spin" /> Conectando...</>}
          {status?.ok && <><CheckCircle2 size={13} /> {status.msg}</>}
          {status && !status.ok && <><XCircle size={13} /> {status.msg}</>}
        </div>
      )}
      <div className="page-wrapper">
        {!session ? (
          <Login isDark={isDark} setIsDark={setIsDark} onLogin={handleLogin} />
        ) : (
          <AppShell session={session} isDark={isDark} setIsDark={setIsDark} onLogout={handleLogout} />
        )}
      </div>
    </>
  );
}

export default App;
