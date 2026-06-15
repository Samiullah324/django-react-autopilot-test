import { Menu, X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-start">
        <button
          className="btn btn-icon btn-secondary mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="navbar-greeting">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
        </span>
      </div>
      <div className="navbar-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
