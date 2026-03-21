import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sun, Moon, Mail, Lock, Eye, EyeOff, Ticket } from 'lucide-react';
import axios from 'axios';
import './Login.css';

// 1. COMPONENTE DE LOGIN (La interfaz moderna)
function Login() {
  const [isDark, setIsDark] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('empleado');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="theme-toggle" onClick={() => setIsDark(!isDark)}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
            <Ticket size={40} strokeWidth={1.5} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>CentralTicket</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Accede a tu panel de gestión</p>
        </div>

        <div className="role-selector">
          {['admin', 'tecnico', 'empleado'].map((r) => (
            <button 
              key={r}
              className={`role-btn ${role === r ? 'active' : ''}`}
              onClick={() => setRole(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <Mail className="input-icon" />
            <input type="email" className="login-input" placeholder="Correo corporativo" />
          </div>

          <div className="input-group">
            <Lock className="input-icon" />
            <input type={showPass ? "text" : "password"} className="login-input" placeholder="Contraseña" />
            <div 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <button className="primary-btn">Entrar como {role}</button>
        </form>
      </div>
    </div>
  );
}

// 2. COMPONENTE PRINCIPAL (El que organiza todo)
function App() {
  const [status, setStatus] = useState('⏳ Conectando...');

  useEffect(() => {
    axios.get('http://localhost:3000/api/status')
      .then(res => setStatus(`✅ ${res.data.message}`))
      .catch(() => setStatus('❌ Error: Backend desconectado'));
  }, []);

  return (
    <Router>
      {/* Barra de estado superior */}
      <div style={{ 
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        backgroundColor: '#1e293b', color: '#38bdf8', 
        padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' 
      }}>
        {status}
      </div>

      <Routes>
        <Route path="/" element={<Login />} />
        {/* Aquí podrías añadir más rutas mañana */}
      </Routes>
    </Router>
  );
}

export default App;