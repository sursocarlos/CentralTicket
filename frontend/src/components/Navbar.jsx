// Componente de la barra de navegación del usuario

import { NavLink, useNavigate } from 'react-router-dom';
import {
  Ticket, LayoutDashboard, Users, Tag,
  ClipboardList, PlusCircle, Sun, Moon, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Define los links de navegación para cada rol en un objeto
const NAV = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Panel' },
    { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/admin/categorias', icon: Tag, label: 'Categorías' },
  ],
  tecnico: [
    { to: '/tecnico', icon: ClipboardList, label: 'Mis tickets' },
  ],
  empleado: [
    { to: '/empleado', icon: LayoutDashboard, label: 'Inicio' },
    { to: '/empleado/incidencias', icon: ClipboardList, label: 'Mis tickets' },
    { to: '/empleado/crear', icon: PlusCircle, label: 'Nueva' },
  ],
};

export default function Navbar() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const links = NAV[user?.rol] || [];

  // Genera las iniciales del nombre para el avatar. "Juan García" : "JG" 
  const initials = user?.nombre?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <>
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Ticket size={20} />
          </div>
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">CentralTicket</div>
            <div className="sidebar-brand-sub">Gestión de incidencias</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menú</div>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 2}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user?.nombre}</div>
              <div className="sidebar-user-role">{user?.rol}</div>
            </div>
          </div>
          <button className="sidebar-action-btn theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button className="sidebar-action-btn logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── TOPBAR MÓVIL ── */}
      <header className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <div className="sidebar-logo-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <Ticket size={15} />
          </div>
          <span className="sidebar-brand-name" style={{ fontSize: '0.875rem' }}>CentralTicket</span>
        </div>
        <div className="mobile-topbar-actions">
          <button
            className="sidebar-action-btn theme-btn"
            onClick={toggleTheme}
            style={{ padding: '0.35rem 0.4rem', width: 'auto' }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="mobile-topbar-avatar" title={user?.nombre}>
            {initials}
          </div>
          <button
            className="sidebar-action-btn logout-btn"
            onClick={handleLogout}
            style={{ padding: '0.35rem 0.4rem', width: 'auto' }}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── BOTTOM NAV MÓVIL ── */}
      <nav className="bottom-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}