import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, Eye, EyeOff, User, ClipboardCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  
  // Login Role Tab: 'admin' or 'driver'
  const [activeTab, setActiveTab] = useState('admin');
  
  // Credentials
  const [email, setEmail] = useState('admin@manivtha.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleToggle = (role) => {
    setActiveTab(role);
    if (role === 'admin') {
      setEmail('admin@manivtha.com');
      setPassword('admin123');
    } else {
      setEmail('rajesh@manivtha.com');
      setPassword('driver123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      addToast(`Successfully signed in to ${activeTab === 'admin' ? 'Admin Portal' : 'Driver Console'}!`, 'success');
    } else {
      addToast(result.message || 'Invalid credentials', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">M</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>Manivtha Tours</div>
          </div>

          {/* SPLIT PORTAL TAB SELECTOR */}
          <div 
            style={{ 
              display: 'flex', 
              backgroundColor: 'var(--background-color)', 
              padding: '4px', 
              borderRadius: 'var(--border-radius-sm)', 
              marginBottom: '1.75rem',
              border: '1px solid var(--border-color)'
            }}
          >
            <button 
              type="button" 
              onClick={() => handleRoleToggle('admin')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                backgroundColor: activeTab === 'admin' ? 'var(--card-background)' : 'transparent',
                color: activeTab === 'admin' ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: activeTab === 'admin' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              Admin Portal
            </button>
            <button 
              type="button" 
              onClick={() => handleRoleToggle('driver')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                backgroundColor: activeTab === 'driver' ? 'var(--card-background)' : 'transparent',
                color: activeTab === 'driver' ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: activeTab === 'driver' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              Driver Console
            </button>
          </div>
          
          <h1 className="login-title" style={{ fontSize: '1.6rem' }}>
            {activeTab === 'admin' ? 'Sign in as Administrator' : 'Sign in as Driver'}
          </h1>
          <p className="login-subtitle" style={{ marginBottom: '2rem' }}>
            {activeTab === 'admin' 
              ? 'Access fleet logs, driver registry, trip dispatch and analytics reports.' 
              : 'Log your daily check-in, inspect checklist and view your assigned trips.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="email">Portal Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'admin@manivtha.com' : 'rajesh@manivtha.com'}
                  style={{ paddingLeft: '38px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <a href="#forgot" style={{ fontSize: '0.8rem', fontWeight: 500 }} onClick={() => addToast('System credentials are seeded automatically. Select role at the top.', 'info')}>
                  Need Help?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '38px', paddingRight: '38px', width: '100%' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                id="remember"
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>Remember this device</label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : `Enter ${activeTab === 'admin' ? 'Admin Dashboard' : 'Driver Console'}`}
            </button>
          </form>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
            <Shield size={14} style={{ color: '#10b981' }} />
            Manivtha Operations Security Verified
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: '1.2' }}>Optimize Fleet Workflows, Log Trips, Track Fuel</h2>
          <p style={{ color: '#8e9bb2', marginTop: '1rem', fontSize: '1rem' }}>
            A unified operations panel designed to audit daily transport logs, track vehicle conditions, control trip starts and ends, and generate CSV/PDF statements in real-time.
          </p>

          <div className="login-right-illustration">
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8e9bb2', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.5rem' }}>Live Fleet Snapshot</div>
            <div className="illustration-stat">
              <div>
                <div style={{ fontWeight: 600 }}>Active Fleet Vehicles</div>
                <div style={{ fontSize: '0.75rem', color: '#8e9bb2' }}>Vehicles on duty now</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>12 / 16</div>
            </div>
            <div className="illustration-stat">
              <div>
                <div style={{ fontWeight: 600 }}>Completed Trips Today</div>
                <div style={{ fontSize: '0.75rem', color: '#8e9bb2' }}>Airport and local corporate travel</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>28 Trips</div>
            </div>
            <div className="illustration-stat">
              <div>
                <div style={{ fontWeight: 600 }}>Odometer Checks Done</div>
                <div style={{ fontSize: '0.75rem', color: '#8e9bb2' }}>Driver daily logs filed</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>100%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
