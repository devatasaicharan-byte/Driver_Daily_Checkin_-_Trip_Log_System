import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Settings as SetIcon, Database, Moon, Sun, Lock, RefreshCw, Key, User } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Settings = () => {
  const { user, token, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  // Profile Edit fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    const fetchDriverPhone = async () => {
      if (user?.role === 'driver') {
        try {
          const res = await fetch(`${API_BASE}/drivers`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const profile = data.data.find(d => d.userId == user.id);
            if (profile) {
              setPhone(profile.phone);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchDriverPhone();
  }, [user, token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name) {
      addToast('Name is required', 'warning');
      return;
    }
    if (user?.role === 'driver' && !phone) {
      addToast('Phone number is required for drivers', 'warning');
      return;
    }

    setSubmittingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Profile details updated successfully!', 'success');
        refreshUser(); // Triggers navbar & sidebar update!
      } else {
        addToast(data.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      addToast('Network error updating profile', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('WARNING: Are you sure you want to reset and re-seed the database? This will clear all custom logs and restore mock data.')) return;
    
    try {
      addToast('Sending database reset command...', 'info');
      const res = await fetch(`${API_BASE}/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.status === 'OK') {
        addToast('Database successfully reset and seeded to default values!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      addToast('Failed to reset database.', 'error');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>System Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure interface options, edit profile contact details, and manage databases.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* EDIT PROFILE DETAILS CARD */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            <User size={18} /> Edit Profile Details
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Portal Email (Read-Only)</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-name">Full Name *</label>
              <input 
                id="profile-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            {user?.role === 'driver' && (
              <div className="form-group">
                <label htmlFor="profile-phone">Phone Number *</label>
                <input 
                  id="profile-phone"
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9845012345"
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.85rem' }}
              disabled={submittingProfile}
            >
              {submittingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* User Card */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Key size={18} /> User Session Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <div><strong>Logged User:</strong> {user?.name || 'Manivtha Admin'}</div>
            <div><strong>Email ID:</strong> {user?.email || 'admin@manivtha.com'}</div>
            <div><strong>Portal Role:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--primary-color)' }}>{user?.role || 'admin'}</span></div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance Settings
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Color Theme</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Switch between light mode and dark mode.</div>
            </div>
            <button className="btn btn-secondary" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </div>
        </div>

        {/* Database administration (Admin only) */}
        {user?.role === 'admin' && (
          <div className="table-card" style={{ padding: '1.5rem', borderLeft: '3px solid var(--danger-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--danger-color)' }}>
              <Database size={18} /> Database Administration
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Reset JSON Database</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clears out custom inputs, re-initializes tables, and writes default mock values.</div>
              </div>
              <button className="btn btn-primary" onClick={handleResetDatabase} style={{ backgroundColor: 'var(--danger-color)' }}>
                Reset & Re-seed
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
