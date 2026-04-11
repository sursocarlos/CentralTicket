import { NavLink, useNavigate } from 'react-router-dom';
import {
  Ticket, LayoutDashboard, Users, Tag,
  ClipboardList, PlusCircle, Sun, Moon, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = {
  admin: [
    { to: '/admin',             icon: LayoutDashboard, label: 'Panel general' },
    { to: '/admin/usuarios',    icon: Users,           label: 'Usuarios' },
    { to: '/admin/categorias',  icon: Tag,             label: 'Categorías' },
  ],
  tecnico: [
    { to: '/tecnico', icon: ClipboardList, label: 'Mis incidencias' },
  ],
  empleado: [
    { to: '/empleado',            icon: LayoutDashboard, label: 'Inicio' },
    { to: '/empleado/incidencias',icon: ClipboardList,   label: 'Mis incidencias' },
    { to: '/empleado/crear',      icon: PlusCircle,      label: 'Nueva incidencia' },
  ],
};

export default function Navbar() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const links = NAV[user?.rol] || [];
  const initials = user?.nombre?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
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
  );
}