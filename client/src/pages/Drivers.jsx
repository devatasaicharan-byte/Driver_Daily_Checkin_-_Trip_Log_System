import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ShieldAlert, 
  Save, 
  Calendar, 
  X,
  Phone,
  FileText
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const API_BASE = 'http://localhost:5000/api';

const Drivers = () => {
  const { token, isAdmin } = useAuth();
  const { addToast } = useToast();
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals Toggle
  const [showFormModal, setShowFormModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Active editing/inspecting item
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewingDriver, setViewingDriver] = useState(null);

  // Form Fields
  const [driverName, setDriverName] = useState('');
  const [driverId, setDriverId] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [experience, setExperience] = useState('');
  const [status, setStatus] = useState('Available');

  const [formErrors, setFormErrors] = useState({});

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch driver roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [token]);

  const openAddModal = () => {
    setEditingDriver(null);
    setDriverName('');
    setDriverId(`DRV00${drivers.length + 1}`); // Simple increment default
    setPhone('');
    setLicenseNumber('');
    
    const today = new Date();
    setJoiningDate(today.toISOString().split('T')[0]);
    
    const nextFiveYears = new Date();
    nextFiveYears.setFullYear(today.getFullYear() + 5);
    setLicenseExpiry(nextFiveYears.toISOString().split('T')[0]);
    
    setExperience('');
    setStatus('Available');
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setDriverName(driver.driverName);
    setDriverId(driver.driverId);
    setPhone(driver.phone);
    setLicenseNumber(driver.licenseNumber);
    setLicenseExpiry(driver.licenseExpiry);
    setJoiningDate(driver.joiningDate);
    setExperience(driver.experience);
    setStatus(driver.status);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openProfileModal = (driver) => {
    setViewingDriver(driver);
    setShowProfileModal(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!driverName.trim()) errs.driverName = 'Driver name is required';
    if (!driverId.trim()) errs.driverId = 'Driver ID is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    if (!licenseExpiry) errs.licenseExpiry = 'License expiration date is required';
    if (!joiningDate) errs.joiningDate = 'Joining date is required';
    if (!experience || isNaN(experience) || parseInt(experience) < 0) {
      errs.experience = 'Experience must be a positive integer';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const url = editingDriver ? `${API_BASE}/drivers/${editingDriver.id}` : `${API_BASE}/drivers`;
    const method = editingDriver ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverName,
          driverId,
          phone,
          licenseNumber,
          licenseExpiry,
          joiningDate,
          experience: parseInt(experience),
          status
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Driver record saved.', 'success');
        setShowFormModal(false);
        fetchDrivers();
      } else {
        addToast(data.message || 'Failed to save driver.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Server connection failure.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this driver record? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/drivers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Driver record deleted', 'success');
        fetchDrivers();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      addToast('Failed to delete driver.', 'error');
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.driverId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Driver Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inspect experience parameters, contact numbers, and monitor licensing expirations.</p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add New Driver
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="table-card" style={{ padding: '0px', overflow: 'visible' }}>
        <div className="table-header-controls">
          <h3 className="table-title">Registered Personnel</h3>
          
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name, ID, phone..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '260px' }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : filteredDrivers.length > 0 ? (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Driver ID</th>
                  <th>Driver Name</th>
                  <th>Contact Details</th>
                  <th>License Details</th>
                  <th>Joined Date</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.driverId}</td>
                    <td style={{ fontWeight: 600 }}>{d.driverName}</td>
                    <td>
                      <div>{d.phone}</div>
                    </td>
                    <td>
                      <div>{d.licenseNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: new Date(d.licenseExpiry) < new Date() ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                        Exp: {d.licenseExpiry}
                      </div>
                    </td>
                    <td>{d.joiningDate}</td>
                    <td>{d.experience} Years</td>
                    <td>
                      <span className={`status-pill ${d.status.toLowerCase().replace(' ', '')}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon-only" title="View Profile Card" onClick={() => openProfileModal(d)}>
                          <Eye size={14} />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button className="btn-icon-only" title="Edit Driver Details" onClick={() => openEditModal(d)}>
                              <Edit size={14} />
                            </button>
                            <button className="btn-icon-only delete" title="Delete Driver Record" onClick={() => handleDeleteDriver(d.id)}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState 
              title="No Drivers Registered" 
              description="No drivers matched your search criteria."
              actionLabel={isAdmin ? "Add New Driver" : null}
              onAction={isAdmin ? openAddModal : null}
            />
          )}
        </div>
      </div>

      {/* ADD / EDIT DRIVER MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingDriver ? 'Edit Driver Record' : 'Register New Driver'}</h3>
              <button className="modal-close-btn" onClick={() => setShowFormModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveDriver}>
              <div className="modal-body">
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  
                  {/* Name */}
                  <div className="form-group">
                    <label>Driver Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rajesh Kumar"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      style={{ borderColor: formErrors.driverName ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.driverName && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.driverName}</span>}
                  </div>

                  {/* Driver ID */}
                  <div className="form-group">
                    <label>Driver ID (Unique Code) *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. DRV005"
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      style={{ borderColor: formErrors.driverId ? 'var(--danger-color)' : '' }}
                      disabled={editingDriver !== null} // Lock ID on edit
                    />
                    {formErrors.driverId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.driverId}</span>}
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ borderColor: formErrors.phone ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.phone && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.phone}</span>}
                  </div>

                  {/* Experience */}
                  <div className="form-group">
                    <label>Experience (Years) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 5"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      style={{ borderColor: formErrors.experience ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.experience && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.experience}</span>}
                  </div>

                  {/* License Number */}
                  <div className="form-group">
                    <label>License Number *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. KA5120200001234"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      style={{ borderColor: formErrors.licenseNumber ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.licenseNumber && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.licenseNumber}</span>}
                  </div>

                  {/* License Expiry */}
                  <div className="form-group">
                    <label>License Expiry Date *</label>
                    <input 
                      type="date" 
                      value={licenseExpiry}
                      onChange={(e) => setLicenseExpiry(e.target.value)}
                      style={{ borderColor: formErrors.licenseExpiry ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.licenseExpiry && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.licenseExpiry}</span>}
                  </div>

                  {/* Joining Date */}
                  <div className="form-group">
                    <label>Joining Date *</label>
                    <input 
                      type="date" 
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      style={{ borderColor: formErrors.joiningDate ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.joiningDate && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.joiningDate}</span>}
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <label>Initial status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={14} /> {submitting ? 'Saving...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DRIVER PROFILE CARD MODAL */}
      {showProfileModal && viewingDriver && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Driver Profile Card</h3>
              <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}><X size={18} /></button>
            </div>
            
            <div className="modal-body">
              <div className="profile-card-header">
                <div className="profile-card-avatar">
                  {viewingDriver.driverName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-card-meta">
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{viewingDriver.driverName}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Driver ID: {viewingDriver.driverId}</span>
                  <span className={`status-pill ${viewingDriver.status.toLowerCase().replace(' ', '')}`} style={{ marginTop: '6px', alignSelf: 'flex-start' }}>
                    {viewingDriver.status}
                  </span>
                </div>
              </div>

              <div className="profile-grid-info" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div>
                  <div className="profile-info-label"><Phone size={10} style={{ marginRight: '4px' }} /> Phone Number</div>
                  <div className="profile-info-value">{viewingDriver.phone}</div>
                </div>
                <div>
                  <div className="profile-info-label"><FileText size={10} style={{ marginRight: '4px' }} /> Experience</div>
                  <div className="profile-info-value">{viewingDriver.experience} Years on duty</div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div className="profile-info-label"><Calendar size={10} style={{ marginRight: '4px' }} /> Joining Date</div>
                  <div className="profile-info-value">{viewingDriver.joiningDate}</div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div className="profile-info-label">License Key</div>
                  <div className="profile-info-value" style={{ fontFamily: 'monospace' }}>{viewingDriver.licenseNumber}</div>
                </div>
                <div style={{ marginTop: '10px', gridColumn: 'span 2' }}>
                  <div className="profile-info-label">License Expiry</div>
                  <div className="profile-info-value" style={{ color: new Date(viewingDriver.licenseExpiry) < new Date() ? 'var(--danger-color)' : '' }}>
                    {viewingDriver.licenseExpiry} {new Date(viewingDriver.licenseExpiry) < new Date() ? '(Expired)' : '(Active)'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
