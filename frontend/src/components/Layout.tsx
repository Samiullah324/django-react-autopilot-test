import {
  ArrowLeftRight,
  Bell,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/warehouses', icon: Warehouse, label: 'Warehouses' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Package size={18} />
          </div>
          <div>
            <h1>StockFlow</h1>
            <p>Inventory Management</p>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--sidebar-text)' }}>
            {user?.username} · {user?.role}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-icon btn-secondary mobile-menu-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
            </span>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
