import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Play, 
  CheckSquare, 
  XSquare, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  Search, 
  TrendingUp,
  AlertTriangle 
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const API_BASE = 'http://localhost:5000/api';

const Trips = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  
  // Lists
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields for New Trip
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [startingKm, setStartingKm] = useState('');
  const [tripStatus, setTripStatus] = useState('Started'); // Default to start trip immediately
  
  // Modal Fields for Completing Trip
  const [activeTripForComplete, setActiveTripForComplete] = useState(null);
  const [endingKm, setEndingKm] = useState('');
  const [endTime, setEndTime] = useState('');

  // Table filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const resTrips = await fetch(`${API_BASE}/trips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataTrips = await resTrips.json();

      const resDrivers = await fetch(`${API_BASE}/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataDrivers = await resDrivers.json();

      const resVehicles = await fetch(`${API_BASE}/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataVehicles = await resVehicles.json();

      if (dataTrips.success) setTrips(dataTrips.data);
      if (dataDrivers.success) setDrivers(dataDrivers.data.filter(d => d.status !== 'Inactive'));
      if (dataVehicles.success) setVehicles(dataVehicles.data.filter(v => v.status !== 'Inactive'));
    } catch (err) {
      console.error('Error loading trips data:', err);
      addToast('Failed to connect to backend server. Verify services.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Default values
    const today = new Date();
    setTripDate(today.toISOString().split('T')[0]);
    setStartTime(today.toTimeString().split(' ')[0].substring(0, 5));
  }, [token]);

  const validateNewTrip = () => {
    const newErrors = {};
    if (!driverId) newErrors.driverId = 'Select a driver';
    if (!vehicleId) newErrors.vehicleId = 'Select a vehicle';
    if (!pickupLocation) newErrors.pickupLocation = 'Pickup is required';
    if (!destination) newErrors.destination = 'Destination is required';
    if (!customerName) newErrors.customerName = 'Customer name is required';
    if (!tripDate) newErrors.tripDate = 'Date is required';
    if (!startTime) newErrors.startTime = 'Time is required';
    if (!startingKm) newErrors.startingKm = 'Starting KM is required';
    
    if (startingKm && (isNaN(parseInt(startingKm)) || parseInt(startingKm) < 0)) {
      newErrors.startingKm = 'Must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!validateNewTrip()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverId: parseInt(driverId),
          vehicleId: parseInt(vehicleId),
          pickupLocation,
          destination,
          customerName,
          tripDate,
          startTime,
          startingKm: parseInt(startingKm),
          status: tripStatus
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setShowAddForm(false);
        // Reset form
        setDriverId('');
        setVehicleId('');
        setPickupLocation('');
        setDestination('');
        setCustomerName('');
        setStartingKm('');
        fetchData();
      } else {
        addToast(data.message || 'Validation error, vehicle might be active on another trip.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, please verify backend API connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/start`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Trip is now started!', 'success');
        fetchData();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      addToast('Error starting trip.', 'error');
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip log?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Trip cancelled successfully', 'success');
        fetchData();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      addToast('Error cancelling trip.', 'error');
    }
  };

  const openCompleteModal = (trip) => {
    setActiveTripForComplete(trip);
    setEndingKm('');
    const now = new Date();
    setEndTime(now.toTimeString().split(' ')[0].substring(0, 5));
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    if (!endingKm || !endTime) {
      addToast('Please fill out all completion fields', 'warning');
      return;
    }

    const endKmVal = parseInt(endingKm);
    const startKmVal = parseInt(activeTripForComplete.startingKm);

    if (endKmVal <= startKmVal) {
      addToast(`Ending KM (${endKmVal}) must be greater than Starting KM (${startKmVal})`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/trips/${activeTripForComplete.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endingKm: endKmVal,
          endTime
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast(`Trip completed! Distance: ${data.data.totalDistance} km.`, 'success');
        setActiveTripForComplete(null);
        fetchData();
      } else {
        addToast(data.message, 'error');
      }
    } catch (err) {
      addToast('Error completing trip', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.role === 'driver' ? 'My Assigned Trips' : 'Trip Management'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.role === 'driver' 
              ? 'View ongoing and scheduled trip routes assigned to you.' 
              : 'Create, start, monitor, and complete logs for airport pickups and outstation transport.'}
          </p>
        </div>
        
        {user?.role !== 'driver' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle size={16} /> {showAddForm ? 'View Trip History' : 'Schedule / Start New Trip'}
          </button>
        )}
      </div>

      {/* CREATE NEW TRIP FORM */}
      {showAddForm && (
        <div className="form-container" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Schedule / Dispatch Trip</h3>
          <form onSubmit={handleCreateTrip}>
            <div className="form-grid">
              
              {/* Driver select */}
              <div className="form-group">
                <label>Assigned Driver *</label>
                <select 
                  value={driverId} 
                  onChange={(e) => setDriverId(e.target.value)}
                  style={{ borderColor: errors.driverId ? 'var(--danger-color)' : '' }}
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.driverName} ({d.status})</option>
                  ))}
                </select>
                {errors.driverId && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.driverId}</span>}
              </div>

              {/* Vehicle select */}
              <div className="form-group">
                <label>Assigned Vehicle *</label>
                <select 
                  value={vehicleId} 
                  onChange={(e) => setVehicleId(e.target.value)}
                  style={{ borderColor: errors.vehicleId ? 'var(--danger-color)' : '' }}
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.vehicleNumber} ({v.status})</option>
                  ))}
                </select>
                {errors.vehicleId && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.vehicleId}</span>}
              </div>

              {/* Customer */}
              <div className="form-group">
                <label>Customer Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Wipro / Guest Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ borderColor: errors.customerName ? 'var(--danger-color)' : '' }}
                />
                {errors.customerName && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.customerName}</span>}
              </div>

              {/* Starting KM */}
              <div className="form-group">
                <label>Starting Odometer (KM) *</label>
                <input 
                  type="number" 
                  placeholder="e.g. 124500"
                  value={startingKm}
                  onChange={(e) => setStartingKm(e.target.value)}
                  style={{ borderColor: errors.startingKm ? 'var(--danger-color)' : '' }}
                />
                {errors.startingKm && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.startingKm}</span>}
              </div>

              {/* Pickup Location */}
              <div className="form-group">
                <label>Pickup Location *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Indiranagar Office"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  style={{ borderColor: errors.pickupLocation ? 'var(--danger-color)' : '' }}
                />
                {errors.pickupLocation && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.pickupLocation}</span>}
              </div>

              {/* Destination */}
              <div className="form-group">
                <label>Destination Location *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kempegowda Airport Terminal 2"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ borderColor: errors.destination ? 'var(--danger-color)' : '' }}
                />
                {errors.destination && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.destination}</span>}
              </div>

              {/* Date */}
              <div className="form-group">
                <label>Trip Date *</label>
                <input 
                  type="date" 
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  style={{ borderColor: errors.tripDate ? 'var(--danger-color)' : '' }}
                />
                {errors.tripDate && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.tripDate}</span>}
              </div>

              {/* Time */}
              <div className="form-group">
                <label>Start/Scheduled Time *</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ borderColor: errors.startTime ? 'var(--danger-color)' : '' }}
                />
                {errors.startTime && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.startTime}</span>}
              </div>

              {/* Action State */}
              <div className="form-group">
                <label>Trip Launch Action</label>
                <select value={tripStatus} onChange={(e) => setTripStatus(e.target.value)}>
                  <option value="Started">Start Immediately (On Trip)</option>
                  <option value="Pending">Schedule (Pending Start)</option>
                </select>
              </div>
            </div>

            <div className="btn-group">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Dispatching...' : 'Dispatch Trip'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRIP LOGS LIST TABLE */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="table-card">
          <div className="table-header-controls">
            <h3 className="table-title">Trip History Logs</h3>
            <div className="table-actions">
              
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search passenger, driver..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <select 
                className="table-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Trip Statuses</option>
                <option value="Started">Started</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            {filteredTrips.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Driver & Vehicle</th>
                    <th>Customer Name</th>
                    <th>Locations</th>
                    <th>Trip Date & Time</th>
                    <th>Starting / Ending KM</th>
                    <th>Distance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map(trip => (
                    <tr key={trip.id}>
                      <td style={{ fontWeight: 600 }}>TRIP-0{trip.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trip.driverName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plate: {trip.vehicleNumber}</div>
                      </td>
                      <td>{trip.customerName}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--secondary-color)' }}>P:</strong> {trip.pickupLocation}</div>
                        <div style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--primary-color)' }}>D:</strong> {trip.destination}</div>
                      </td>
                      <td>
                        <div>{trip.tripDate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {trip.startTime} - {trip.endTime || 'Ongoing'}
                        </div>
                      </td>
                      <td>
                        <div>S: {trip.startingKm != null ? `${trip.startingKm.toLocaleString()} km` : 'Pending'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          E: {trip.endingKm ? `${trip.endingKm.toLocaleString()} km` : 'Pending'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {trip.status === 'Completed' ? `${trip.totalDistance} km` : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-pill ${trip.status.toLowerCase()}`}>{trip.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* Pending -> Start */}
                          {trip.status === 'Pending' && (
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => handleStartTrip(trip.id)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px', color: 'var(--secondary-color)' }}
                            >
                              <Play size={12} /> Start
                            </button>
                          )}
                          
                          {/* Started -> Complete */}
                          {trip.status === 'Started' && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => openCompleteModal(trip)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px' }}
                            >
                              <CheckSquare size={12} /> Complete
                            </button>
                          )}
                          
                          {/* Cancel button */}
                          {user?.role !== 'driver' && (trip.status === 'Pending' || trip.status === 'Started') && (
                            <button 
                              className="btn-icon-only delete" 
                              onClick={() => handleCancelTrip(trip.id)}
                              title="Cancel Trip"
                            >
                              <XSquare size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState 
                title="No Trips Found" 
                description="Adjust search fields or register a new trip to dispatch."
                actionLabel="Dispatch a New Trip"
                onAction={() => setShowAddForm(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* COMPLETE TRIP MODAL */}
      {activeTripForComplete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Complete Active Trip log</h3>
              <button className="modal-close-btn" onClick={() => setActiveTripForComplete(null)}><XSquare size={18} /></button>
            </div>
            
            <form onSubmit={handleCompleteTrip}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passenger / Customer</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activeTripForComplete.customerName}</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Starting Odometer</div>
                      <div style={{ fontWeight: 600 }}>{activeTripForComplete.startingKm} KM</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Route</div>
                      <div style={{ fontSize: '0.8rem' }}>{activeTripForComplete.pickupLocation.split(',')[0]} ➜ {activeTripForComplete.destination.split(',')[0]}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Ending KM */}
                  <div className="form-group">
                    <label>Ending Odometer Reading (KM) *</label>
                    <input 
                      type="number" 
                      placeholder="Must be greater than Starting KM"
                      value={endingKm}
                      onChange={(e) => setEndingKm(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Must be greater than starting odometer ({activeTripForComplete.startingKm} KM)
                    </span>
                  </div>

                  {/* End Time */}
                  <div className="form-group">
                    <label>Trip End Time *</label>
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTripForComplete(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Completing...' : 'Log Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
