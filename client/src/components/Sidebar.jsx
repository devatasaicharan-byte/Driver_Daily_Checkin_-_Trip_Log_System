import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  MapPin, 
  Users, 
  Car, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout, user } = useAuth();

  // Conditionally render menu links based on the user's role
  const menuItems = user?.role === 'driver' 
    ? [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'checkin', name: 'My Check-in', icon: ClipboardCheck },
        { id: 'trips', name: 'My Trips', icon: MapPin },
        { id: 'profile', name: 'My Profile', icon: User },
        { id: 'settings', name: 'Settings', icon: Settings }
      ]
    : [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'checkin', name: 'Check-in Status', icon: ClipboardCheck },
        { id: 'trips', name: 'Trips', icon: MapPin },
        { id: 'drivers', name: 'Drivers', icon: Users },
        { id: 'vehicles', name: 'Vehicles', icon: Car },
        { id: 'reports', name: 'Reports', icon: FileText },
        { id: 'analytics', name: 'Analytics', icon: BarChart3 },
        { id: 'profile', name: 'Profile Settings', icon: User },
        { id: 'settings', name: 'Settings', icon: Settings }
      ];

  const handleMenuClick = (pageId) => {
    setCurrentPage(pageId);
    setMobileOpen(false); // Close sidebar on mobile after clicking
  };

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">M</div>
        <div className="logo-text">Manivtha Tours</div>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <li 
              key={item.id} 
              className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              <Icon size={20} />
              <span className="menu-item-text">{item.name}</span>
            </li>
          );
        })}

        <li 
          className={`menu-item logout`}
          onClick={logout}
        >
          <LogOut size={20} />
          <span className="menu-item-text">Logout</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
