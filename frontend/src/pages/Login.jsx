import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const HOME = { admin: '/admin', tecnico: '/tecnico', empleado: '/empleado' };

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const { login, user, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(HOME[user.rol] || '/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.usuario, data.token);
      navigate(HOME[data.usuario.rol], { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <button className="login-theme-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="login-logo">
          <div className="login-logo-icon">
            <Ticket size={26} strokeWidth={1.5} />
          </div>
          <h1>CentralTicket</h1>
          <p>Accede a tu panel de gestión</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-input-wrap">
            <Mail className="login-icon" />
            <input
              type="email"
              className="login-input"
              placeholder="Correo corporativo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-input-wrap">
            <Lock className="login-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              className="login-input"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ paddingRight: '2.75rem' }}
            />
            <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Entrando...</> : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}