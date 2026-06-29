import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Save, 
  RefreshCw, 
  X, 
  Upload, 
  Camera,
  Users,
  Search,
  Eye,
  CheckCircle,
  AlertCircle,
  Phone,
  Car
} from 'lucide-react';
import { FormSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const API_BASE = 'http://localhost:5000/api';

const CheckIn = ({ setCurrentPage }) => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  
  // Lists fetched from backend
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allCheckins, setAllCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Admin-only search filter
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('All');
  
  // Modal for detail view
  const [inspectedCheckin, setInspectedCheckin] = useState(null);

  // Form Fields (For Driver view)
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [vehicleCondition, setVehicleCondition] = useState('');
  const [fuelFilled, setFuelFilled] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [engineStatus, setEngineStatus] = useState('Normal');
  const [tyreCondition, setTyreCondition] = useState('Good');
  const [batteryStatus, setBatteryStatus] = useState('Charged');
  const [remarks, setRemarks] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  const loadFormData = async () => {
    try {
      setLoading(true);
      // Load Drivers
      const resDrivers = await fetch(`${API_BASE}/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataDrivers = await resDrivers.json();

      // Load Vehicles
      const resVehicles = await fetch(`${API_BASE}/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataVehicles = await resVehicles.json();

      if (dataDrivers.success) {
        setDrivers(dataDrivers.data);
      }
      if (dataVehicles.success) {
        setVehicles(dataVehicles.data);
      }

      // If user is Admin, load all Check-ins to build the daily checklist status roster
      if (user && user.role === 'admin') {
        const resCheckins = await fetch(`${API_BASE}/checkins`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataCheckins = await resCheckins.json();
        if (dataCheckins.success) {
          setAllCheckins(dataCheckins.data);
        }
      }

      // If user is a driver, auto-select their driver record
      if (user && user.role === 'driver' && dataDrivers.success) {
        const currentDriverRecord = dataDrivers.data.find(d => d.userId == user?.id);
        if (currentDriverRecord) {
          setDriverId(currentDriverRecord.id);
        }
      }
    } catch (err) {
      console.error('Error loading check-in dependencies:', err);
      addToast('Failed to load active drivers and vehicles list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default date and time
    const today = new Date();
    setCheckinDate(today.toISOString().split('T')[0]);
    
    const timeStr = today.toTimeString().split(' ')[0].substring(0, 5);
    setCheckinTime(timeStr);

    loadFormData();
  }, [token, user]);

  // Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Image size should be less than 2MB', 'warning');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Base64 encoding
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!driverId) newErrors.driverId = 'Select a driver';
    if (!vehicleId) newErrors.vehicleId = 'Select a vehicle';
    if (!checkinDate) newErrors.checkinDate = 'Check-in date is required';
    if (!checkinTime) newErrors.checkinTime = 'Check-in time is required';
    if (!vehicleCondition) newErrors.vehicleCondition = 'Vehicle condition is mandatory';
    if (!odometerReading) newErrors.odometerReading = 'Odometer reading is required';
    
    if (odometerReading && (isNaN(parseInt(odometerReading)) || parseInt(odometerReading) <= 0)) {
      newErrors.odometerReading = 'Odometer reading must be a positive number';
    }

    if (fuelFilled !== '') {
      const fuelVal = parseFloat(fuelFilled);
      if (isNaN(fuelVal)) {
        newErrors.fuelFilled = 'Fuel must be a valid number';
      } else if (fuelVal <= 0) {
        newErrors.fuelFilled = 'Fuel entered must be greater than zero';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setDriverId('');
    setVehicleId('');
    const today = new Date();
    setCheckinDate(today.toISOString().split('T')[0]);
    setCheckinTime(today.toTimeString().split(' ')[0].substring(0, 5));
    setVehicleCondition('');
    setFuelFilled('');
    setOdometerReading('');
    setEngineStatus('Normal');
    setTyreCondition('Good');
    setBatteryStatus('Charged');
    setRemarks('');
    setImagePreview(null);
    setErrors({});
    addToast('Form fields cleared.', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please resolve validation errors in the form.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverId: parseInt(driverId),
          vehicleId: parseInt(vehicleId),
          checkinDate,
          checkinTime,
          vehicleCondition,
          fuelFilled: fuelFilled !== '' ? parseFloat(fuelFilled) : null,
          odometerReading: parseInt(odometerReading),
          engineStatus,
          tyreCondition,
          batteryStatus,
          remarks,
          vehicleImageUrl: imagePreview || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('Daily Check-in logged successfully!', 'success');
        setCurrentPage('dashboard');
      } else {
        addToast(data.message || 'Failed to complete check-in log.', 'error');
      }
    } catch (err) {
      console.error('Error submitting check-in:', err);
      addToast('Network connection failure. Check backend service.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        {user?.role === 'admin' ? <TableSkeleton rows={4} /> : <FormSkeleton />}
      </div>
    );
  }

  // --- ADMIN RENDER: DAILY CHECK-IN ROSTER STATUS ---
  if (user?.role === 'admin') {
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute roster checkin records for today
    const roster = drivers
      .filter(d => d.status !== 'Inactive')
      .map(driver => {
        // Find if they have checked in today
        const checkinToday = allCheckins.find(c => c.driverId === driver.id && c.checkinDate === todayStr) || null;
        
        // Find vehicle plate
        const vehicle = vehicles.find(v => v.assignedDriverId === driver.id) || {};
        
        return {
          id: driver.id,
          driverName: driver.driverName,
          driverId: driver.driverId,
          phone: driver.phone,
          vehicleNumber: vehicle.vehicleNumber || 'Unassigned',
          vehicleModel: vehicle.model || 'N/A',
          isCheckedIn: !!checkinToday,
          checkinRecord: checkinToday
        };
      });

    const filteredRoster = roster.filter(item => {
      const matchSearch = 
        item.driverName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        item.driverId.toLowerCase().includes(adminSearch.toLowerCase()) ||
        item.vehicleNumber.toLowerCase().includes(adminSearch.toLowerCase());

      const matchFilter = 
        adminFilter === 'All' ||
        (adminFilter === 'CheckedIn' && item.isCheckedIn) ||
        (adminFilter === 'Pending' && !item.isCheckedIn);

      return matchSearch && matchFilter;
    });

    return (
      <div className="page-container">
        <div className="table-card">
          <div className="table-header-controls">
            <div>
              <h3 className="table-title">Drivers Daily Check-in Tracker</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Verify daily vehicle checklist completions for active drivers today (<strong>{todayStr}</strong>).
              </p>
            </div>
            
            <div className="table-actions">
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search driver, plate..." 
                  className="search-input"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
              </div>

              <select 
                className="table-filter-select"
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
              >
                <option value="All">All Standby Status</option>
                <option value="CheckedIn">Checked-In Today</option>
                <option value="Pending">Pending Check-In</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            {filteredRoster.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Assigned Vehicle</th>
                    <th>Duty Status</th>
                    <th>Logged Time</th>
                    <th>Fuel / Odo today</th>
                    <th>Condition status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.driverName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.driverId}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.vehicleNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.vehicleModel}</div>
                      </td>
                      <td>
                        <span className={`status-pill ${item.isCheckedIn ? 'available' : 'pending'}`}>
                          {item.isCheckedIn ? 'Checked-In' : 'Pending Check-In'}
                        </span>
                      </td>
                      <td>{item.isCheckedIn ? item.checkinRecord.checkinTime : '--:--'}</td>
                      <td>
                        {item.isCheckedIn ? (
                          <div>
                            <div>Odo: {item.checkinRecord.odometerReading.toLocaleString()} km</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fuel: {item.checkinRecord.fuelFilled > 0 ? `${item.checkinRecord.fuelFilled} L` : 'None logged'}</div>
                          </div>
                        ) : '--'}
                      </td>
                      <td>
                        {item.isCheckedIn ? (
                          <span className={`status-pill ${item.checkinRecord.vehicleCondition.toLowerCase().replace(' ', '')}`}>
                            {item.checkinRecord.vehicleCondition}
                          </span>
                        ) : '--'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {item.isCheckedIn ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', gap: '4px' }}
                              onClick={() => setInspectedCheckin(item.checkinRecord)}
                            >
                              <Eye size={12} /> Inspect checklist
                            </button>
                          ) : (
                            <a 
                              href={`tel:${item.phone}`} 
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', gap: '4px', color: 'var(--warning-color)' }}
                              onClick={() => addToast(`Contact Rajesh at ${item.phone}`, 'info')}
                            >
                              <Phone size={12} /> Call Driver
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState 
                title="No Drivers Listed" 
                description="No active driver roster matched your current filters."
              />
            )}
          </div>
        </div>

        {/* INSPECT LOG MODAL */}
        {inspectedCheckin && (
          <div className="modal-overlay" onClick={() => setInspectedCheckin(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Check-in Log Summary</h3>
                <button className="modal-close-btn" onClick={() => setInspectedCheckin(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <div><strong>Driver Name:</strong> {inspectedCheckin.driverName}</div>
                  <div><strong>Vehicle Plate:</strong> {inspectedCheckin.vehicleNumber}</div>
                  <div><strong>Date / Time:</strong> {inspectedCheckin.checkinDate} ({inspectedCheckin.checkinTime})</div>
                  <div><strong>Odometer KM:</strong> {inspectedCheckin.odometerReading.toLocaleString()} km</div>
                  <div><strong>Condition Rating:</strong> <span className={`status-pill ${inspectedCheckin.vehicleCondition.toLowerCase().replace(' ', '')}`}>{inspectedCheckin.vehicleCondition}</span></div>
                  <div><strong>Fuel Logged:</strong> {inspectedCheckin.fuelFilled > 0 ? `${inspectedCheckin.fuelFilled} Litres` : '0 Litres'}</div>
                </div>

                <div style={{ padding: '12px', background: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', margin: '15px 0', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px' }}>Detailed Inspection Criteria:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div>Engine: <strong>{inspectedCheckin.engineStatus}</strong></div>
                    <div>Tyres: <strong>{inspectedCheckin.tyreCondition}</strong></div>
                    <div>Battery: <strong>{inspectedCheckin.batteryStatus}</strong></div>
                  </div>
                </div>

                {inspectedCheckin.vehicleImageUrl && (
                  <div style={{ margin: '15px 0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Condition Photo:</div>
                    <img src={inspectedCheckin.vehicleImageUrl} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }} alt="Checklist" />
                  </div>
                )}

                <div style={{ marginTop: '10px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Remarks:</strong>
                  <p style={{ padding: '8px', background: 'var(--background-color)', borderRadius: '4px', fontSize: '0.85rem', marginTop: '4px', fontStyle: 'italic' }}>
                    "{inspectedCheckin.remarks || 'No remarks recorded.'}"
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setInspectedCheckin(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DRIVER RENDER: STANDARD CHECK-IN FORM ---
  return (
    <div className="page-container">
      <div className="form-container">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Submit Daily Vehicle Check-in</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Inspect your assigned vehicle checklist, check tyre and battery health, and record current odometer.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            
            {/* Driver Name field */}
            <div className="form-group">
              <label htmlFor="driver">Driver Name *</label>
              {user?.role === 'driver' ? (
                <input 
                  type="text" 
                  value={drivers.find(d => d.id == driverId)?.driverName || user?.name || ''} 
                  disabled 
                  style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-muted)', fontWeight: 500 }}
                />
              ) : (
                <select 
                  id="driver"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  style={{ borderColor: errors.driverId ? 'var(--danger-color)' : '' }}
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.driverName} - {d.driverId}</option>
                  ))}
                </select>
              )}
              {errors.driverId && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.driverId}</span>}
            </div>

            {/* Vehicle Field */}
            <div className="form-group">
              <label htmlFor="vehicle">Assigned Vehicle *</label>
              <select 
                id="vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                style={{ borderColor: errors.vehicleId ? 'var(--danger-color)' : '' }}
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.model} - {v.vehicleNumber}</option>
                ))}
              </select>
              {errors.vehicleId && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.vehicleId}</span>}
            </div>

            {/* Date Field */}
            <div className="form-group">
              <label htmlFor="date">Check-in Date *</label>
              <input 
                id="date"
                type="date" 
                value={checkinDate}
                onChange={(e) => setCheckinDate(e.target.value)}
                style={{ borderColor: errors.checkinDate ? 'var(--danger-color)' : '' }}
              />
              {errors.checkinDate && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.checkinDate}</span>}
            </div>

            {/* Time Field */}
            <div className="form-group">
              <label htmlFor="time">Check-in Time *</label>
              <input 
                id="time"
                type="time" 
                value={checkinTime}
                onChange={(e) => setCheckinTime(e.target.value)}
                style={{ borderColor: errors.checkinTime ? 'var(--danger-color)' : '' }}
              />
              {errors.checkinTime && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.checkinTime}</span>}
            </div>

            {/* Vehicle Condition */}
            <div className="form-group">
              <label htmlFor="condition">Vehicle Condition *</label>
              <select 
                id="condition"
                value={vehicleCondition}
                onChange={(e) => setVehicleCondition(e.target.value)}
                style={{ borderColor: errors.vehicleCondition ? 'var(--danger-color)' : '' }}
              >
                <option value="">-- Choose Condition --</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
              {errors.vehicleCondition && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.vehicleCondition}</span>}
            </div>

            {/* Odometer Reading */}
            <div className="form-group">
              <label htmlFor="odometer">Current Odometer (KM) *</label>
              <input 
                id="odometer"
                type="number" 
                placeholder="e.g. 124500"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                style={{ borderColor: errors.odometerReading ? 'var(--danger-color)' : '' }}
              />
              {errors.odometerReading && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.odometerReading}</span>}
            </div>

            {/* Fuel Filled */}
            <div className="form-group">
              <label htmlFor="fuel">Fuel Filled Today (Litres)</label>
              <input 
                id="fuel"
                type="number" 
                step="0.01"
                placeholder="Optional, e.g. 25.5"
                value={fuelFilled}
                onChange={(e) => setFuelFilled(e.target.value)}
                style={{ borderColor: errors.fuelFilled ? 'var(--danger-color)' : '' }}
              />
              {errors.fuelFilled && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.fuelFilled}</span>}
            </div>

            {/* Engine Status */}
            <div className="form-group">
              <label htmlFor="engine">Engine Status</label>
              <select id="engine" value={engineStatus} onChange={(e) => setEngineStatus(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="Needs Inspection">Needs Inspection</option>
              </select>
            </div>

            {/* Tyre Condition */}
            <div className="form-group">
              <label htmlFor="tyre">Tyre Condition</label>
              <select id="tyre" value={tyreCondition} onChange={(e) => setTyreCondition(e.target.value)}>
                <option value="Good">Good</option>
                <option value="Worn">Worn</option>
                <option value="Replace Immediately">Replace Immediately</option>
              </select>
            </div>

            {/* Battery Status */}
            <div className="form-group">
              <label htmlFor="battery">Battery Status</label>
              <select id="battery" value={batteryStatus} onChange={(e) => setBatteryStatus(e.target.value)}>
                <option value="Charged">Charged</option>
                <option value="Weak">Weak</option>
                <option value="Dead">Dead</option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="form-group full-width">
              <label>Upload Vehicle Image</label>
              <div 
                className="image-upload-box"
                onClick={() => document.getElementById('image-upload').click()}
              >
                <input 
                  type="file" 
                  id="image-upload" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  style={{ display: 'none' }} 
                />
                {imagePreview ? (
                  <div>
                    <img src={imagePreview} className="image-upload-preview" alt="Preview" />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Click box to upload a different image</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <Camera size={28} />
                    <span>Click or Drag Vehicle photo here</span>
                    <span style={{ fontSize: '0.75rem' }}>Max size: 2MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="form-group full-width">
              <label htmlFor="remarks">Remarks / Observations</label>
              <textarea 
                id="remarks"
                rows="3" 
                placeholder="Log any scratches, dashboard alerts, or travel assignments..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="btn-group">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setCurrentPage('dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleReset}
              disabled={submitting}
              style={{ color: 'var(--warning-color)' }}
            >
              <RefreshCw size={14} /> Reset
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={14} /> {submitting ? 'Logging...' : 'Save Check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckIn;
