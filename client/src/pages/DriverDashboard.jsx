import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ClipboardCheck, 
  MapPin, 
  Car, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  Play,
  ArrowRight,
  User
} from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';

const API_BASE = 'http://localhost:5000/api';

const DriverDashboard = ({ setCurrentPage }) => {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Trip completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [endingKm, setEndingKm] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchDriverStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/analytics/driver`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load driver stats. Check database server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverStats();
  }, [token]);

  const handleStartTrip = async (tripId) => {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/start`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('Trip started successfully!', 'success');
        fetchDriverStats();
      } else {
        addToast(resData.message, 'error');
      }
    } catch (err) {
      addToast('Error starting trip.', 'error');
    }
  };

  const handleCompleteTripSubmit = async (e) => {
    e.preventDefault();
    const activeTrip = data?.activeTrip;
    if (!activeTrip) return;

    if (!endingKm || !endTime) {
      addToast('Ending KM and End Time are required', 'warning');
      return;
    }

    const endKmVal = parseInt(endingKm);
    const startKmVal = parseInt(activeTrip.startingKm);

    if (endKmVal <= startKmVal) {
      addToast(`Ending KM (${endKmVal}) must be greater than Starting KM (${startKmVal})`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/trips/${activeTrip.id}/complete`, {
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

      const resData = await res.json();
      if (resData.success) {
        addToast(`Trip completed successfully! Total distance: ${resData.data.totalDistance} km.`, 'success');
        setShowCompleteModal(false);
        fetchDriverStats();
      } else {
        addToast(resData.message, 'error');
      }
    } catch (err) {
      addToast('Error completing trip', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-container">
        <div className="kpi-grid">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const driver = data?.driver || {};
  const stats = data?.stats || { totalTrips: 0, completedTrips: 0, totalDistance: 0, isCheckedInToday: false };
  const myVehicle = data?.myVehicle || {};
  const activeTrip = data?.activeTrip || null;
  const upcomingTrips = data?.upcomingTrips || [];

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, var(--sidebar-background), #1e293b)',
          color: '#ffffff',
          borderRadius: 'var(--border-radius-md)',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Welcome back, {driver.driverName}!</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
            Check your scheduled assignments, submit your vehicle check-in list, and log trip metrics.
          </p>
          {myVehicle.vehicleNumber && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '14px', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
              <Car size={16} /> Assigned Fleet Vehicle: <strong style={{ color: '#fff' }}>{myVehicle.model} ({myVehicle.vehicleNumber})</strong>
            </div>
          )}
        </div>
        <div 
          style={{ 
            position: 'absolute', 
            right: '-10px', 
            bottom: '-10px', 
            color: 'rgba(255,255,255,0.03)', 
            transform: 'rotate(-10deg)', 
            pointerEvents: 'none' 
          }}
        >
          <Car size={180} />
        </div>
      </div>

      {/* CHECK-IN OUTSTANDING ALERT */}
      {!stats.isCheckedInToday && (
        <div 
          style={{ 
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--border-radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)' }}>Daily Check-in Outstanding</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You must submit your daily check-in logs and inspection checklists before starting your trips.</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setCurrentPage('checkin')} style={{ backgroundColor: 'var(--warning-color)' }}>
            Log Check-in Now
          </button>
        </div>
      )}

      {/* Driver stats Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* KPI 1 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">My Total Distance</span>
            <div className="kpi-icon-wrapper primary"><TrendingUp size={18} /></div>
          </div>
          <span className="kpi-value">{stats.totalDistance.toLocaleString()} KM</span>
          <div className="kpi-footer">
            <span>Cumulative completed logs</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Completed Trips</span>
            <div className="kpi-icon-wrapper secondary"><CheckCircle size={18} /></div>
          </div>
          <span className="kpi-value">{stats.completedTrips} Trips</span>
          <div className="kpi-footer">
            <span>Overall trips finalized</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Today's Check-in Status</span>
            <div className={`kpi-icon-wrapper ${stats.isCheckedInToday ? 'secondary' : 'warning'}`}>
              <ClipboardCheck size={18} />
            </div>
          </div>
          <span className="kpi-value" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {stats.isCheckedInToday ? 'Checked-In' : 'Pending Check-In'}
          </span>
          <div className="kpi-footer">
            <span>Odometer reading today</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* CURRENT ACTIVE TRIP LOG */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} style={{ color: 'var(--primary-color)' }} /> Active / Ongoing Trip
          </h3>

          {activeTrip ? (
            <div className="table-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span className="status-pill ontrip" style={{ marginBottom: '8px' }}>Trip In Progress</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passenger</div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{activeTrip.customerName}</h4>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Starting Odometer</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{activeTrip.startingKm.toLocaleString()} KM</div>
                </div>
              </div>

              {/* Route */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  backgroundColor: 'var(--background-color)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--border-radius-sm)', 
                  border: '1px solid var(--border-color)', 
                  marginBottom: '1.5rem' 
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pickup</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeTrip.pickupLocation}</div>
                </div>
                <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Destination</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeTrip.destination}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Started at: <strong>{activeTrip.startTime}</strong></span>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setEndingKm('');
                    const now = new Date();
                    setEndTime(now.toTimeString().split(' ')[0].substring(0, 5));
                    setShowCompleteModal(true);
                  }}
                >
                  Log Trip Completion
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '3.5rem 2rem' }}>
              <MapPin size={38} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>No active trip moving now</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', marginTop: '4px' }}>
                You do not have any ongoing trip logs. Select from scheduled jobs below to start.
              </p>
            </div>
          )}
        </div>

        {/* UPCOMING SCHEDULED TRIPS */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} style={{ color: 'var(--secondary-color)' }} /> Upcoming Assignments
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingTrips.length > 0 ? (
              upcomingTrips.map(trip => (
                <div key={trip.id} className="table-card" style={{ padding: '1.25rem', marginBottom: '0px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TRIP-0{trip.id}</span>
                    <span className="status-pill pending">Pending Start</span>
                  </div>
                  
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{trip.customerName}</div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {trip.pickupLocation.split(',')[0]} ➜ {trip.destination.split(',')[0]}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Time: <strong>{trip.startTime}</strong> ({trip.tripDate})
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleStartTrip(trip.id)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', gap: '4px', color: 'var(--secondary-color)' }}
                      disabled={!!activeTrip} // Cannot start another if one is active
                      title={activeTrip ? "Complete your active trip first" : "Start trip"}
                    >
                      <Play size={12} /> Start Trip
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending assignments found.</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* COMPLETE TRIP DRAW MODAL */}
      {showCompleteModal && activeTrip && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Log Trip Completion Metrics</h3>
              <button className="modal-close-btn" onClick={() => setShowCompleteModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCompleteTripSubmit}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trip Starting Odometer</div>
                  <div style={{ fontWeight: 700 }}>{activeTrip.startingKm} KM</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Ending Odometer Reading (KM) *</label>
                    <input 
                      type="number" 
                      value={endingKm}
                      onChange={(e) => setEndingKm(e.target.value)}
                      placeholder="e.g. 124650"
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Must be strictly greater than start: {activeTrip.startingKm} KM
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Trip Finish Time *</label>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting details...' : 'Submit Logs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
