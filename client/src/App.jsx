import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Trips from './pages/Trips';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import DriverDashboard from './pages/DriverDashboard';
import Profile from './pages/Profile';

import { X, ClipboardCheck, Settings as SetIcon, Calendar, Droplet, User, Car } from 'lucide-react';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Used to inspect check-in logs

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Initializing system sessions...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    // Protect routes: drivers can only view dashboard, checkin, trips, profile and settings
    if (user && user.role === 'driver') {
      if (!['dashboard', 'checkin', 'trips', 'profile', 'settings'].includes(currentPage)) {
        return <NotFound setCurrentPage={setCurrentPage} />;
      }
    }

    switch (currentPage) {
      case 'dashboard':
        return user?.role === 'driver'
          ? <DriverDashboard setCurrentPage={setCurrentPage} />
          : <Dashboard setCurrentPage={setCurrentPage} setSelectedItem={setSelectedItem} />;
      case 'checkin':
        return <CheckIn setCurrentPage={setCurrentPage} />;
      case 'trips':
        return <Trips />;
      case 'drivers':
        return <Drivers />;
      case 'vehicles':
        return <Vehicles />;
      case 'reports':
        return <Reports />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <NotFound setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-content">
        <Navbar 
          currentPage={currentPage}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          setMobileOpen={setMobileOpen}
        />
        
        {renderPage()}
      </div>

      {/* GLOBAL CHECK-IN DETAILS INSPECTOR MODAL */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardCheck size={18} style={{ color: 'var(--primary-color)' }} /> Check-in Details Log
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedItem(null)}><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Driver Meta */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.08)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                    <User size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged Driver</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedItem.driverName}</div>
                  </div>
                </div>

                {/* Vehicle Meta */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                    <Car size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Vehicle</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedItem.vehicleNumber}</div>
                  </div>
                </div>

                {/* Date Meta */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date & Time</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedItem.checkinDate} ({selectedItem.checkinTime})</div>
                  </div>
                </div>

                {/* Fuel Volume */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--info-color)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                    <Droplet size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fuel Refill Today</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedItem.fuelFilled > 0 ? `${selectedItem.fuelFilled} Litres` : 'None logged'}</div>
                  </div>
                </div>

              </div>

              {/* Status details Grid */}
              <div style={{ padding: '12px 16px', background: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px' }}>Vehicle Checklist Inspection</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Engine Checklist</div>
                    <div style={{ fontWeight: 600 }}>{selectedItem.engineStatus || 'Normal'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tyres Status</div>
                    <div style={{ fontWeight: 600 }}>{selectedItem.tyreCondition || 'Good'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Battery Status</div>
                    <div style={{ fontWeight: 600 }}>{selectedItem.batteryStatus || 'Charged'}</div>
                  </div>
                </div>
              </div>

              {/* Odometer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Odometer reading logged:</strong>
                <span style={{ fontWeight: 700 }}>{selectedItem.odometerReading.toLocaleString()} KM</span>
              </div>

              {/* Condition */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Vehicle Overall Condition:</strong>
                <span className={`status-pill ${selectedItem.vehicleCondition.toLowerCase().replace(' ', '')}`}>{selectedItem.vehicleCondition}</span>
              </div>

              {/* Photo Preview if exists */}
              {selectedItem.vehicleImageUrl && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Uploaded Vehicle Condition Photo:</div>
                  <img src={selectedItem.vehicleImageUrl} style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }} alt="Vehicle checklist snapshot" />
                </div>
              )}

              {/* Remarks */}
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Remarks:</strong>
                <p style={{ marginTop: '4px', fontSize: '0.85rem', background: 'var(--background-color)', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontStyle: 'italic', whiteSpace: 'normal', color: 'var(--text-color)' }}>
                  "{selectedItem.remarks || 'No remarks recorded.'}"
                </p>
              </div>

            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Close details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
