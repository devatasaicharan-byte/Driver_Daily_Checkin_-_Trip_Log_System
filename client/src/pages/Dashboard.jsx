import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  MapPin, 
  CheckCircle, 
  Droplet, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Eye, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

// Register Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = 'http://localhost:5000/api';

const Dashboard = ({ setCurrentPage, setSelectedItem }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('checkinTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Dashboard Analytics
      const resStats = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      
      // Fetch Check-ins (Recent Activity Table)
      const resCheckins = await fetch(`${API_BASE}/checkins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataCheckins = await resCheckins.json();

      if (dataStats.success) {
        setStats(dataStats);
      }
      
      if (dataCheckins.success) {
        setRecentActivity(dataCheckins.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      addToast('Failed to load dashboard metrics. Verify database server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Chart Data configurations
  const renderTripsPerDayChart = () => {
    if (!stats?.charts?.tripsPerDay) return null;
    const chartData = stats.charts.tripsPerDay;
    
    return {
      labels: chartData.map(d => d.date.substring(5)), // MM-DD
      datasets: [
        {
          label: 'Daily Trips',
          data: chartData.map(d => d.count),
          fill: true,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.3
        }
      ]
    };
  };

  const renderMonthlyTripsChart = () => {
    if (!stats?.charts?.monthlyTrips) return null;
    const chartData = stats.charts.monthlyTrips;
    
    return {
      labels: chartData.map(d => d.month),
      datasets: [
        {
          label: 'Monthly Trips',
          data: chartData.map(d => d.count),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }
      ]
    };
  };

  const renderVehicleUsageChart = () => {
    if (!stats?.charts?.vehicleUsage) return null;
    const chartData = stats.charts.vehicleUsage;
    
    return {
      labels: chartData.map(d => d.vehicleNumber),
      datasets: [
        {
          label: 'Trips by Vehicle',
          data: chartData.map(d => d.tripCount),
          backgroundColor: '#10b981',
          borderRadius: 4
        }
      ]
    };
  };

  const renderFuelConsumptionChart = () => {
    if (!stats?.charts?.fuelConsumption) return null;
    const chartData = stats.charts.fuelConsumption;
    
    return {
      labels: chartData.map(d => d.vehicleNumber),
      datasets: [
        {
          label: 'Fuel Added (Liters)',
          data: chartData.map(d => d.totalFuel),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }
      ]
    };
  };

  const renderDriverPerformanceChart = () => {
    if (!stats?.charts?.driverPerformance) return null;
    const chartData = stats.charts.driverPerformance;
    
    return {
      labels: chartData.map(d => d.driverName.split(' ')[0]), // First names
      datasets: [
        {
          label: 'Completed Trips',
          data: chartData.map(d => d.completedTrips),
          backgroundColor: '#6366f1',
          borderRadius: 4
        }
      ]
    };
  };

  const renderCompletedVsActiveChart = () => {
    if (!stats?.charts?.tripStatusCounts) return null;
    const counts = stats.charts.tripStatusCounts;
    
    return {
      labels: ['Completed', 'Active', 'Pending', 'Cancelled'],
      datasets: [
        {
          data: [counts.Completed, counts.Started, counts.Pending, counts.Cancelled],
          backgroundColor: ['#10b981', '#2563eb', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }
      ]
    };
  };

  // Sort & Filter Handlers
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filtered & Sorted activity list
  const filteredActivity = recentActivity
    .filter(act => {
      const matchSearch = 
        act.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.remarks.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'All' || act.vehicleCondition === statusFilter;
      
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Paginated List
  const totalPages = Math.ceil(filteredActivity.length / itemsPerPage);
  const paginatedActivity = filteredActivity.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-muted)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-muted)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--text-color)',
          boxWidth: 12
        }
      }
    }
  };

  if (loading && !stats) {
    return (
      <div className="page-container">
        <div className="kpi-grid">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const summary = stats?.summary || {
    totalDrivers: 0,
    availableVehicles: 0,
    activeTrips: 0,
    completedTrips: 0,
    fuelToday: 0,
    pendingCheckins: 0
  };

  return (
    <div className="page-container">
      {/* Top Summary KPI Cards */}
      <div className="kpi-grid">
        {/* KPI 1 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Drivers</span>
            <div className="kpi-icon-wrapper primary"><Users size={18} /></div>
          </div>
          <span className="kpi-value">{summary.totalDrivers}</span>
          <div className="kpi-footer">
            <span className="trend-indicator up"><ArrowUpRight size={14} /> Registered</span>
            <span>active drivers</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Available Fleet</span>
            <div className="kpi-icon-wrapper secondary"><Car size={18} /></div>
          </div>
          <span className="kpi-value">{summary.availableVehicles}</span>
          <div className="kpi-footer">
            <span className="trend-indicator up"><ArrowUpRight size={14} /> Ready</span>
            <span>vehicles on standby</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Trips</span>
            <div className="kpi-icon-wrapper primary"><MapPin size={18} /></div>
          </div>
          <span className="kpi-value">{summary.activeTrips}</span>
          <div className="kpi-footer">
            <span className="trend-indicator up"><ArrowUpRight size={14} /> On Duty</span>
            <span>vehicles currently moving</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Completed Trips</span>
            <div className="kpi-icon-wrapper secondary"><CheckCircle size={18} /></div>
          </div>
          <span className="kpi-value">{summary.completedTrips}</span>
          <div className="kpi-footer">
            <span className="trend-indicator up"><ArrowUpRight size={14} /> Successful</span>
            <span>all-time completed logs</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Fuel Filled Today</span>
            <div className="kpi-icon-wrapper warning"><Droplet size={18} /></div>
          </div>
          <span className="kpi-value">{summary.fuelToday} L</span>
          <div className="kpi-footer">
            <span className="trend-indicator"><ArrowUpRight size={14} /> Logged</span>
            <span>liters today</span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Check-ins</span>
            <div className="kpi-icon-wrapper danger"><Clock size={18} /></div>
          </div>
          <span className="kpi-value">{summary.pendingCheckins}</span>
          <div className="kpi-footer">
            <span className="trend-indicator down"><AlertCircle size={14} /> Unresolved</span>
            <span>drivers outstanding</span>
          </div>
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Trips Per Day (Last 7 Days)</h3>
          <div className="chart-container">
            {renderTripsPerDayChart() && <Line data={renderTripsPerDayChart()} options={chartOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Completed vs Active Trips Breakdown</h3>
          <div className="chart-container">
            {renderCompletedVsActiveChart() && <Doughnut data={renderCompletedVsActiveChart()} options={doughnutOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Monthly Fleet Usage</h3>
          <div className="chart-container">
            {renderMonthlyTripsChart() && <Bar data={renderMonthlyTripsChart()} options={chartOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Vehicle Trip Frequency</h3>
          <div className="chart-container">
            {renderVehicleUsageChart() && <Bar data={renderVehicleUsageChart()} options={chartOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Fuel Consumed per Vehicle (Liters)</h3>
          <div className="chart-container">
            {renderFuelConsumptionChart() && <Bar data={renderFuelConsumptionChart()} options={chartOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Driver Experience Performance</h3>
          <div className="chart-container">
            {renderDriverPerformanceChart() && <Bar data={renderDriverPerformanceChart()} options={chartOptions} />}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="table-card">
        <div className="table-header-controls">
          <h3 className="table-title">Recent Check-in Logs</h3>
          
          <div className="table-actions">
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search driver, plate..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPageNum(1); }}
              />
            </div>
            
            {/* Filter */}
            <select 
              className="table-filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPageNum(1); }}
            >
              <option value="All">All Conditions</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Needs Repair">Needs Repair</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          {paginatedActivity.length > 0 ? (
            <table className="custom-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('driverName')}>Driver</th>
                  <th onClick={() => handleSort('vehicleNumber')}>Vehicle</th>
                  <th onClick={() => handleSort('checkinDate')}>Check-in Date/Time</th>
                  <th onClick={() => handleSort('fuelFilled')}>Fuel (L)</th>
                  <th onClick={() => handleSort('odometerReading')}>KM Reading</th>
                  <th onClick={() => handleSort('vehicleCondition')}>Vehicle Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivity.map((act) => (
                  <tr key={act.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{act.driverName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {act.driverId}</div>
                    </td>
                    <td>{act.vehicleNumber}</td>
                    <td>
                      <div>{act.checkinDate}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.checkinTime}</div>
                    </td>
                    <td>{act.fuelFilled > 0 ? `${act.fuelFilled} L` : 'N/A'}</td>
                    <td>{act.odometerReading.toLocaleString()} km</td>
                    <td>
                      <span className={`status-pill ${act.vehicleCondition.toLowerCase().replace(' ', '')}`}>
                        {act.vehicleCondition}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon-only" 
                          title="Inspect Check-in" 
                          onClick={() => {
                            setSelectedItem(act);
                            addToast('Opening details for check-in', 'info');
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState 
              title="No check-ins logged" 
              description="Could not find any daily driver check-ins matching current criteria."
              actionLabel="Check-in Driver Now"
              onAction={() => setCurrentPage('checkin')}
            />
          )}
        </div>

        {filteredActivity.length > itemsPerPage && (
          <div className="pagination">
            <span>Showing {(currentPageNum - 1) * itemsPerPage + 1} - {Math.min(currentPageNum * itemsPerPage, filteredActivity.length)} of {filteredActivity.length} check-ins</span>
            <div className="pagination-buttons">
              <button 
                className="pagination-btn" 
                disabled={currentPageNum === 1}
                onClick={() => setCurrentPageNum(prev => prev - 1)}
              >
                Previous
              </button>
              <button 
                className="pagination-btn" 
                disabled={currentPageNum === totalPages}
                onClick={() => setCurrentPageNum(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
