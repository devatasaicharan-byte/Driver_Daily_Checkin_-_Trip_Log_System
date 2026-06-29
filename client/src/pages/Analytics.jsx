import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  BarChart3, 
  TrendingUp, 
  Map, 
  Droplet, 
  Activity, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';

import { Line, Bar, Doughnut } from 'react-chartjs-2';

const API_BASE = 'http://localhost:5000/api';

const Analytics = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to compile interactive analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  // Calculations for mock secondary metrics
  const getFleetMetrics = () => {
    if (!stats) return { totalDistance: 0, avgDistance: 0, totalFuel: 0, fuelEconomy: 0 };
    
    // Total distance of completed trips
    const driverPerf = stats.charts.driverPerformance || [];
    const totalDistance = driverPerf.reduce((sum, d) => sum + d.totalDistance, 0);
    const totalTrips = stats.summary.completedTrips || 1;
    const avgDistance = parseFloat((totalDistance / totalTrips).toFixed(1));

    // Total fuel
    const fuelCons = stats.charts.fuelConsumption || [];
    const totalFuel = fuelCons.reduce((sum, f) => sum + f.totalFuel, 0);

    // Fuel economy (km per litre)
    const fuelEconomy = totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 8.5; // Mock fallback is 8.5 km/L

    return {
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      avgDistance,
      totalFuel: parseFloat(totalFuel.toFixed(1)),
      fuelEconomy
    };
  };

  const metrics = getFleetMetrics();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-color)'
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'var(--border-color)' },
        ticks: { color: 'var(--text-muted)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)' }
      }
    }
  };

  // Charts mapping
  const getTripsCompletedData = () => {
    if (!stats?.charts?.tripsPerDay) return { labels: [], datasets: [] };
    return {
      labels: stats.charts.tripsPerDay.map(d => d.date),
      datasets: [
        {
          label: 'Completed Trips',
          data: stats.charts.tripsPerDay.map(d => d.count),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.2
        }
      ]
    };
  };

  const getMonthlyGrowthData = () => {
    if (!stats?.charts?.monthlyTrips) return { labels: [], datasets: [] };
    return {
      labels: stats.charts.monthlyTrips.map(m => m.month),
      datasets: [
        {
          label: 'Monthly Growth (Trips count)',
          data: stats.charts.monthlyTrips.map(m => m.count),
          backgroundColor: 'rgba(37, 99, 235, 0.85)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  };

  const getVehicleUtilizationData = () => {
    if (!stats?.charts?.vehicleUsage) return { labels: [], datasets: [] };
    return {
      labels: stats.charts.vehicleUsage.map(v => v.vehicleNumber),
      datasets: [
        {
          label: 'Fleet Utilization Count',
          data: stats.charts.vehicleUsage.map(v => v.tripCount),
          backgroundColor: [
            'rgba(37, 99, 235, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(99, 102, 241, 0.8)'
          ],
          borderWidth: 0
        }
      ]
    };
  };

  const getDriverDistanceData = () => {
    if (!stats?.charts?.driverPerformance) return { labels: [], datasets: [] };
    return {
      labels: stats.charts.driverPerformance.map(d => d.driverName),
      datasets: [
        {
          label: 'Total Distance Travelled (KM)',
          data: stats.charts.driverPerformance.map(d => d.totalDistance),
          backgroundColor: 'rgba(99, 102, 241, 0.85)',
          borderRadius: 4
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="kpi-grid">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Interactive Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inspect overall travel stats, fuel volume aggregates, and fleet efficiency quotients.</p>
        </div>
      </div>

      {/* Analytics KPI grid */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2.5rem' }}>
        
        {/* Metric 1 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Distance</span>
            <div className="kpi-icon-wrapper primary"><Map size={18} /></div>
          </div>
          <span className="kpi-value">{metrics.totalDistance.toLocaleString()} KM</span>
          <div className="kpi-footer">
            <span className="trend-indicator up">Ongoing</span>
            <span>fleet travel logged</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Avg Distance / Trip</span>
            <div className="kpi-icon-wrapper secondary"><TrendingUp size={18} /></div>
          </div>
          <span className="kpi-value">{metrics.avgDistance} KM</span>
          <div className="kpi-footer">
            <span>Average length of trip</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Fuel Filled</span>
            <div className="kpi-icon-wrapper warning"><Droplet size={18} /></div>
          </div>
          <span className="kpi-value">{metrics.totalFuel} Litres</span>
          <div className="kpi-footer">
            <span>Overall fuel logged</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Fleet Fuel Economy</span>
            <div className="kpi-icon-wrapper secondary"><Activity size={18} /></div>
          </div>
          <span className="kpi-value">{metrics.fuelEconomy} KM/L</span>
          <div className="kpi-footer">
            <span className="trend-indicator up">Optimal</span>
            <span>fleet efficiency</span>
          </div>
        </div>

      </div>

      {/* Grid of Large Detailed Analytics Charts */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Chart 1: Trips Completed over time */}
        <div className="chart-card">
          <h3 className="chart-title">Completed Trips Trend (Daily)</h3>
          <div className="chart-container" style={{ height: '320px' }}>
            <Line data={getTripsCompletedData()} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Growth */}
        <div className="chart-card">
          <h3 className="chart-title">Monthly Trip Volume Growth</h3>
          <div className="chart-container" style={{ height: '320px' }}>
            <Bar data={getMonthlyGrowthData()} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Vehicle Utilization breakdown */}
        <div className="chart-card">
          <h3 className="chart-title">Vehicle Fleet Share utilization</h3>
          <div className="chart-container" style={{ height: '320px' }}>
            <Doughnut data={getVehicleUtilizationData()} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { color: 'var(--text-color)' } } }
            }} />
          </div>
        </div>

        {/* Chart 4: Driver distances */}
        <div className="chart-card">
          <h3 className="chart-title">Total Distance per Driver (KM)</h3>
          <div className="chart-container" style={{ height: '320px' }}>
            <Bar data={getDriverDistanceData()} options={chartOptions} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
