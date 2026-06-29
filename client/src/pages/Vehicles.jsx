import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Car, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  Save, 
  Calendar, 
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const API_BASE = 'http://localhost:5000/api';

const Vehicles = () => {
  const { token, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal control
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Form Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('SUV');
  const [model, setModel] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessCertificate, setFitnessCertificate] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [status, setStatus] = useState('Available');

  const [formErrors, setFormErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const resVehicles = await fetch(`${API_BASE}/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataVehicles = await resVehicles.json();

      const resDrivers = await fetch(`${API_BASE}/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataDrivers = await resDrivers.json();

      if (dataVehicles.success) setVehicles(dataVehicles.data);
      if (dataDrivers.success) setDrivers(dataDrivers.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch fleet list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setVehicleType('SUV');
    setModel('');
    
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    setInsuranceExpiry(nextYear.toISOString().split('T')[0]);
    setFitnessCertificate(nextYear.toISOString().split('T')[0]);
    
    setRcNumber('');
    setAssignedDriverId('');
    setStatus('Available');
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleNumber(vehicle.vehicleNumber);
    setVehicleType(vehicle.vehicleType);
    setModel(vehicle.model);
    setInsuranceExpiry(vehicle.insuranceExpiry);
    setFitnessCertificate(vehicle.fitnessCertificate);
    setRcNumber(vehicle.rcNumber);
    setAssignedDriverId(vehicle.assignedDriverId || '');
    setStatus(vehicle.status);
    setFormErrors({});
    setShowFormModal(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle plate number is required';
    if (!model.trim()) errs.model = 'Model description is required';
    if (!rcNumber.trim()) errs.rcNumber = 'RC number is required';
    if (!insuranceExpiry) errs.insuranceExpiry = 'Insurance expiry date is required';
    if (!fitnessCertificate) errs.fitnessCertificate = 'Fitness certificate date is required';
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const url = editingVehicle ? `${API_BASE}/vehicles/${editingVehicle.id}` : `${API_BASE}/vehicles`;
    const method = editingVehicle ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleNumber,
          vehicleType,
          model,
          insuranceExpiry,
          fitnessCertificate,
          rcNumber,
          assignedDriverId: assignedDriverId ? parseInt(assignedDriverId) : null,
          status
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Vehicle record saved.', 'success');
        setShowFormModal(false);
        fetchData();
      } else {
        addToast(data.message || 'Failed to save vehicle details.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error saving vehicle details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle from your active fleet database?')) return;

    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Vehicle removed from fleet database.', 'success');
        fetchData();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      addToast('Failed to remove vehicle.', 'error');
    }
  };

  const getDriverNameById = (id) => {
    const driver = drivers.find(d => d.id == id);
    return driver ? driver.driverName : 'Unassigned';
  };

  const filteredVehicles = vehicles.filter(v => 
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.rcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vehicle Fleet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monitor registration certificates, assign default drivers, and verify insurance validity.</p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add New Vehicle
          </button>
        )}
      </div>

      {/* SEARCH fleet */}
      <div className="table-card" style={{ padding: '0px', overflow: 'visible' }}>
        <div className="table-header-controls">
          <h3 className="table-title">Fleet Vehicles</h3>
          
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search plate, model, type..." 
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
          ) : filteredVehicles.length > 0 ? (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Vehicle Model</th>
                  <th>Type</th>
                  <th>RC Number</th>
                  <th>Assigned Driver</th>
                  <th>Doc Expirations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.vehicleNumber}</td>
                    <td style={{ fontWeight: 600 }}>{v.model}</td>
                    <td>{v.vehicleType}</td>
                    <td><code style={{ fontFamily: 'monospace' }}>{v.rcNumber}</code></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{getDriverNameById(v.assignedDriverId)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: new Date(v.insuranceExpiry) < new Date() ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                        Insurance: {v.insuranceExpiry}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: new Date(v.fitnessCertificate) < new Date() ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                        Fitness: {v.fitnessCertificate}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${v.status.toLowerCase().replace(' ', '')}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {isAdmin && (
                          <>
                            <button className="btn-icon-only" title="Edit Vehicle Specs" onClick={() => openEditModal(v)}>
                              <Edit size={14} />
                            </button>
                            <button className="btn-icon-only delete" title="Remove Vehicle" onClick={() => handleDeleteVehicle(v.id)}>
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
              title="No Vehicles Registered" 
              description="No vehicle logs matched your search terms."
              actionLabel={isAdmin ? "Add New Vehicle" : null}
              onAction={isAdmin ? openAddModal : null}
            />
          )}
        </div>
      </div>

      {/* ADD / EDIT VEHICLE MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingVehicle ? 'Edit Vehicle specifications' : 'Register Fleet Vehicle'}</h3>
              <button className="modal-close-btn" onClick={() => setShowFormModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveVehicle}>
              <div className="modal-body">
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  
                  {/* Plate Number */}
                  <div className="form-group">
                    <label>Vehicle Plate Number *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. KA-01-MJ-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      style={{ borderColor: formErrors.vehicleNumber ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.vehicleNumber && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.vehicleNumber}</span>}
                  </div>

                  {/* Model */}
                  <div className="form-group">
                    <label>Model & Make Description *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Toyota Innova Crysta"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ borderColor: formErrors.model ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.model && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.model}</span>}
                  </div>

                  {/* Type */}
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Traveller">Tempo Traveller</option>
                      <option value="MiniBus">Mini Bus</option>
                      <option value="Hatchback">Hatchback</option>
                    </select>
                  </div>

                  {/* RC Number */}
                  <div className="form-group">
                    <label>Registration Certificate (RC) *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. RC-KA01MJ1234"
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value)}
                      style={{ borderColor: formErrors.rcNumber ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.rcNumber && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.rcNumber}</span>}
                  </div>

                  {/* Insurance Expiration */}
                  <div className="form-group">
                    <label>Insurance Expiry Date *</label>
                    <input 
                      type="date" 
                      value={insuranceExpiry}
                      onChange={(e) => setInsuranceExpiry(e.target.value)}
                      style={{ borderColor: formErrors.insuranceExpiry ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.insuranceExpiry && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.insuranceExpiry}</span>}
                  </div>

                  {/* Fitness Expiry */}
                  <div className="form-group">
                    <label>Fitness Certificate Expiry *</label>
                    <input 
                      type="date" 
                      value={fitnessCertificate}
                      onChange={(e) => setFitnessCertificate(e.target.value)}
                      style={{ borderColor: formErrors.fitnessCertificate ? 'var(--danger-color)' : '' }}
                    />
                    {formErrors.fitnessCertificate && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.fitnessCertificate}</span>}
                  </div>

                  {/* Assigned Driver */}
                  <div className="form-group">
                    <label>Assign Default Driver</label>
                    <select value={assignedDriverId} onChange={(e) => setAssignedDriverId(e.target.value)}>
                      <option value="">-- No Default Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.driverName} ({d.driverId})</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <label>Initial Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={14} /> {submitting ? 'Saving specs...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
