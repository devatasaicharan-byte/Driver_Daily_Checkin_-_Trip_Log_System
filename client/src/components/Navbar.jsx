import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ currentPage, sidebarCollapsed, setSidebarCollapsed, setMobileOpen, onSearch }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const getBreadcrumb = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'checkin': return 'Daily Check-in';
      case 'trips': return 'Trip Management';
      case 'drivers': return 'Driver Directory';
      case 'vehicles': return 'Vehicle Fleet';
      case 'reports': return 'Operations Reports';
      case 'analytics': return 'Interactive Analytics';
      case 'settings': return 'System Settings';
      default: return 'Transport Log';
    }
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="icon-btn mobile-menu-btn" onClick={() => setMobileOpen(prev => !prev)} style={{ display: 'none' }}>
          <Menu size={20} />
        </button>
        
        <button 
          className="icon-btn" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={18} />
        </button>

        <div className="breadcrumb">
          Manivtha Tours & Travels / <span className="current">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="nav-search">
        <Search size={16} className="nav-search-icon" />
        <input 
          type="text" 
          placeholder="Search records, vehicles, trip IDs..." 
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>

      <div className="nav-right">
        {/* Dark Mode Toggle */}
        <button 
          className="icon-btn" 
          onClick={toggleTheme} 
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications Icon */}
        <button className="icon-btn" title="View Notifications">
          <Bell size={18} />
          <span className="badge"></span>
        </button>

        {/* Profile Card & Dropdown */}
        <div 
          className="nav-profile" 
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          style={{ position: 'relative' }}
        >
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="profile-info" style={{ display: 'none' }}>
            <span className="profile-name">{user?.name || 'Admin'}</span>
            <span className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'Operations Manager'}</span>
          </div>
          <ChevronDown size={14} className="profile-arrow" />

          {showProfileDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: '45px',
                right: '0',
                backgroundColor: 'var(--card-background)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                minWidth: '160px',
                zIndex: 100
              }}
            >
              <div 
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '4px'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button 
                onClick={logout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger-color)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--border-radius-sm)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--background-color)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
