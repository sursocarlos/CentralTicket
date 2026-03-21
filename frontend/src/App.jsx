import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sun, Moon, Mail, Lock, Eye, EyeOff, Ticket, ShieldCheck, Wrench, UserCircle, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import './Login.css';

// ── Páginas placeholder por rol ─────────────────────────────────

function DashboardAdmin() {
  return (
    <div className="dashboard">
      <ShieldCheck size={48} className="dashboard-icon" />
      <h1>Panel de Administrador</h1>
      <p>Bienvenido al panel de administración de CentralTicket.</p>
    </div>
  );
}

function DashboardTecnico() {
  return (
    <div className="dashboard">
      <Wrench size={48} className="dashboard-icon" />
      <h1>Panel de Técnico</h1>
      <p>Bienvenido al panel de técnico de CentralTicket.</p>
    </div>
  );
}

function DashboardEmpleado() {
  return (
    <div className="dashboard">
      <UserCircle size={48} className="dashboard-icon" />
      <h1>Panel de Empleado</h1>
      <p>Bienvenido al panel de empleado de CentralTicket.</p>
    </div>
  );
}

// ── Componente de Login ─────────────────────────────────────────

function Login() {
  const [isDark, setIsDark] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, introduce tu correo corporativo.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('El formato del correo no es válido.');
      return;
    }
    if (!password.trim()) {
      setError('Por favor, introduce tu contraseña.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/api/login', { email, password });
      const { rol } = res.data.usuario;

      if (rol !== role) {
        setError(`Este usuario no es ${role}.\nSelecciona el rol correcto.`);
        setLoading(false);
        return;
      }

      if (rol === 'admin') navigate('/dashboard/admin');
      else if (rol === 'tecnico') navigate('/dashboard/tecnico');
      else navigate('/dashboard/empleado');

    } catch (err) {
      const msg = err.response?.data?.message || 'Error al conectar con el servidor.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <button
          className="theme-toggle"
          onClick={() => setIsDark(!isDark)}
          aria-label="Cambiar tema"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="login-header">
          <div className="login-icon">
            <Ticket size={40} strokeWidth={1.5} />
          </div>
          <h2 className="login-title">CentralTicket</h2>
          <p className="login-subtitle">Accede a tu panel de gestión</p>
        </div>

        <div className="role-selector">
          {['admin', 'tecnico', 'empleado'].map((r) => (
            <button
              key={r}
              className={`role-btn ${role === r ? 'active' : ''}`}
              onClick={() => { setRole(r); setError(''); }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} noValidate>
          <div className="input-group">
            <label htmlFor="email" className="sr-only">Correo corporativo</label>
            <Mail className="input-icon" aria-hidden="true" />
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="Correo corporativo"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <Lock className="input-icon" aria-hidden="true" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              className="login-input login-input--password"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Mensaje de error estilizado con icono Lucide */}
          {error && (
            <div className="login-error" role="alert">
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '12px', marginRight: '2px'}} />
              <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
            </div>
          )}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading
              ? <><Loader2 size={16} className="spin" /> Entrando...</>
              : `Entrar como ${role}`
            }
          </button>
        </form>

      </div>
    </div>
  );
}

// ── Componente Principal ────────────────────────────────────────

function App() {
  const [status, setStatus] = useState(null); // null = cargando

  useEffect(() => {
    axios.get('http://localhost:3000/api/status')
      .then(res => setStatus({ ok: true, msg: res.data.message }))
      .catch(() => setStatus({ ok: false, msg: 'Backend desconectado' }));
  }, []);

  return (
    <Router>
      <div className={`status-bar ${status ? (status.ok ? 'status-ok' : 'status-error') : 'status-loading'}`}>
        {!status && <><Loader2 size={13} className="spin" /> Conectando...</>}
        {status?.ok  && <><CheckCircle2 size={13} /> {status.msg}</>}
        {status && !status.ok && <><XCircle size={13} /> {status.msg}</>}
      </div>
      <div className="page-wrapper">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard/admin"    element={<DashboardAdmin />} />
          <Route path="/dashboard/tecnico"  element={<DashboardTecnico />} />
          <Route path="/dashboard/empleado" element={<DashboardEmpleado />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
