import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Key, Calendar, Mail, FileText, Phone, Shield } from 'lucide-react';
import { FormSkeleton } from '../components/Skeleton';

const API_BASE = 'http://localhost:5000/api';

const Profile = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState(null);
  
  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        if (user && user.role === 'driver') {
          // Resolve driver record matching logged-in user ID
          const res = await fetch(`${API_BASE}/drivers`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const profile = data.data.find(d => d.userId == user.id);
            if (profile) setDriverProfile(profile);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token, user]);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast('All password fields are mandatory', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('Password updated successfully!', 'success');
        // Clear fields
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        addToast(data.message || 'Incorrect current password.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update password. Check network connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><FormSkeleton /></div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* PROFILE INFO CARD */}
        <div className="table-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div 
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary-color)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.4rem'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user?.name}</h3>
              <span className={`status-pill ${user?.role === 'admin' ? 'ontrip' : 'available'}`} style={{ marginTop: '4px', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Driver Partner'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            
            {/* Email */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Mail size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user?.email}</div>
              </div>
            </div>

            {/* Role details */}
            {user?.role === 'admin' ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operations Privilege</div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Full management read/write authority</div>
                </div>
              </div>
            ) : driverProfile ? (
              <>
                {/* Phone */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Phone</div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{driverProfile.phone}</div>
                  </div>
                </div>

                {/* Experience */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Driving Experience</div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{driverProfile.experience} Years on road</div>
                  </div>
                </div>

                {/* License */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Key size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>License number</div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', fontFamily: 'monospace' }}>{driverProfile.licenseNumber}</div>
                  </div>
                </div>

                {/* Expiry */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>License Expiry</div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{driverProfile.licenseExpiry}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--warning-color)' }}>
                Driver details loading or profile link outstanding.
              </div>
            )}

          </div>
        </div>

        {/* PASSWORD EDIT FORM */}
        <div className="table-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--primary-color)' }} /> Change Account Password
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Ensure your operational security by periodically updating your password.
          </p>

          <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Current Password */}
            <div className="form-group">
              <label htmlFor="old-pass">Current Password *</label>
              <input 
                id="old-pass"
                type="password" 
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="new-pass">New Password *</label>
              <input 
                id="new-pass"
                type="password" 
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label htmlFor="confirm-pass">Confirm New Password *</label>
              <input 
                id="confirm-pass"
                type="password" 
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '10px', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
