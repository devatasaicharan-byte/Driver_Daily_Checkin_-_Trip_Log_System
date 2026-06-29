import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  User, 
  Car,
  Filter
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const API_BASE = 'http://localhost:5000/api';

const Reports = () => {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // Dependency Lists
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Report Filters
  const [reportType, setReportType] = useState('trips');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Drivers and Vehicles on Mount
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const resDrivers = await fetch(`${API_BASE}/drivers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataDrivers = await resDrivers.json();

        const resVehicles = await fetch(`${API_BASE}/vehicles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataVehicles = await resVehicles.json();

        if (dataDrivers.success) setDrivers(dataDrivers.data);
        if (dataVehicles.success) setVehicles(dataVehicles.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadDependencies();
  }, [token]);

  const compileReport = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        type: reportType
      });
      if (driverId) queryParams.append('driverId', driverId);
      if (vehicleId) queryParams.append('vehicleId', vehicleId);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await fetch(`${API_BASE}/reports?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
        addToast(`Report loaded with ${resData.data.length} records.`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to compile report data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    compileReport();
  }, [reportType, driverId, vehicleId, startDate, endDate]);

  // Export to CSV
  const handleExportCSV = () => {
    if (data.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    let headers = [];
    let rows = [];

    if (reportType === 'trips') {
      headers = ['Trip ID', 'Driver Name', 'Vehicle Plate', 'Customer', 'Pickup', 'Destination', 'Date', 'Start Time', 'End Time', 'Starting KM', 'Ending KM', 'Distance (km)', 'Status'];
      rows = data.map(t => [
        `TRIP-0${t.id}`, t.driverName, t.vehicleNumber, t.customerName, t.pickupLocation, t.destination, t.tripDate, t.startTime, t.endTime || 'N/A', t.startingKm, t.endingKm || 'N/A', t.totalDistance, t.status
      ]);
    } else if (reportType === 'checkins') {
      headers = ['Check-in ID', 'Driver Name', 'Vehicle Plate', 'Check-in Date', 'Check-in Time', 'Condition', 'Fuel Added (L)', 'Odometer Reading', 'Engine Status', 'Tyres', 'Battery', 'Remarks'];
      rows = data.map(c => [
        `LOG-0${c.id}`, c.driverName, c.vehicleNumber, c.checkinDate, c.checkinTime, c.vehicleCondition, c.fuelFilled, c.odometerReading, c.engineStatus, c.tyreCondition, c.batteryStatus, c.remarks
      ]);
    } else if (reportType === 'fuel') {
      headers = ['Log ID', 'Driver Name', 'Vehicle Plate', 'Logging Date', 'Logging Time', 'Fuel Filled (Litres)', 'Odometer Reading', 'Remarks'];
      rows = data.map(f => [
        `FUEL-0${f.id}`, f.driverName, f.vehicleNumber, f.date, f.time, f.fuelFilled, f.odometerReading, f.remarks
      ]);
    }

    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      // Escape commas in strings
      const escapedRow = row.map(val => {
        const strVal = String(val === null || val === undefined ? '' : val);
        return strVal.includes(',') ? `"${strVal}"` : strVal;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `manivtha_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV Statement Downloaded', 'success');
  };

  // Export to Excel (CSV format but with spreadsheet compatible mime type)
  const handleExportExcel = () => {
    if (data.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }
    
    // In plain JavaScript, we can download a tab-delimited file or CSV which Excel parses automatically
    // Using CSV output but with XLS extension and Excel content-type:
    let excelContent = "";
    let headers = [];
    let rows = [];

    if (reportType === 'trips') {
      headers = ['Trip ID', 'Driver Name', 'Vehicle Plate', 'Customer', 'Pickup', 'Destination', 'Date', 'Start Time', 'End Time', 'Starting KM', 'Ending KM', 'Distance (km)', 'Status'];
      rows = data.map(t => [
        `TRIP-0${t.id}`, t.driverName, t.vehicleNumber, t.customerName, t.pickupLocation, t.destination, t.tripDate, t.startTime, t.endTime || 'N/A', t.startingKm, t.endingKm || 'N/A', t.totalDistance, t.status
      ]);
    } else if (reportType === 'checkins') {
      headers = ['Check-in ID', 'Driver Name', 'Vehicle Plate', 'Check-in Date', 'Check-in Time', 'Condition', 'Fuel Added (L)', 'Odometer Reading', 'Engine Status', 'Tyres', 'Battery', 'Remarks'];
      rows = data.map(c => [
        `LOG-0${c.id}`, c.driverName, c.vehicleNumber, c.checkinDate, c.checkinTime, c.vehicleCondition, c.fuelFilled, c.odometerReading, c.engineStatus, c.tyreCondition, c.batteryStatus, c.remarks
      ]);
    } else if (reportType === 'fuel') {
      headers = ['Log ID', 'Driver Name', 'Vehicle Plate', 'Logging Date', 'Logging Time', 'Fuel Filled (Litres)', 'Odometer Reading', 'Remarks'];
      rows = data.map(f => [
        `FUEL-0${f.id}`, f.driverName, f.vehicleNumber, f.date, f.time, f.fuelFilled, f.odometerReading, f.remarks
      ]);
    }

    excelContent += headers.join("\t") + "\n";
    rows.forEach(row => {
      excelContent += row.join("\t") + "\n";
    });

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `manivtha_${reportType}_report_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Excel Sheet generated and downloaded', 'success');
  };

  // PDF Print
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Operations Reports</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Extract statements, check-in checklists, and fuel histories.</p>
        </div>
      </div>

      <div className="reports-layout">
        {/* FILTERS COLUMN */}
        <div className="reports-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Filter size={16} /> Filters
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Report Type */}
            <div className="form-group">
              <label>Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="trips">Trips Log History</option>
                <option value="checkins">Daily Driver Check-ins</option>
                <option value="fuel">Fuel Refill Logs</option>
              </select>
            </div>

            {/* Driver Filter */}
            <div className="form-group">
              <label>Filter by Driver</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">-- All Drivers --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.driverName}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Filter */}
            <div className="form-group">
              <label>Filter by Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">-- All Vehicles --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.model} ({v.vehicleNumber})</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <button className="btn btn-secondary" onClick={() => {
              setDriverId('');
              setVehicleId('');
              setStartDate('');
              setEndDate('');
            }}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* REPORT TABLE DISPLAY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="report-export-options">
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportExcel}>
              <Download size={14} /> Export Excel
            </button>
            <button className="btn btn-primary" onClick={handlePrintPDF}>
              <Printer size={14} /> Print / Save PDF
            </button>
          </div>

          <div className="table-card" style={{ padding: '0px' }}>
            <div className="table-header-controls">
              <h3 className="table-title" style={{ textTransform: 'capitalize' }}>Compiled {reportType} Statement</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.length} records matching criteria</span>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <TableSkeleton rows={5} />
              ) : data.length > 0 ? (
                <>
                  {/* TRIPS REPORT VIEW */}
                  {reportType === 'trips' && (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Trip ID</th>
                          <th>Driver Name</th>
                          <th>Vehicle</th>
                          <th>Customer</th>
                          <th>Route</th>
                          <th>Date</th>
                          <th>KM Start/End</th>
                          <th>Distance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map(t => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>TRIP-0{t.id}</td>
                            <td>{t.driverName}</td>
                            <td>{t.vehicleNumber}</td>
                            <td>{t.customerName}</td>
                            <td>{t.pickupLocation.split(',')[0]} ➜ {t.destination.split(',')[0]}</td>
                            <td>{t.tripDate}</td>
                            <td>{t.startingKm} / {t.endingKm || 'N/A'}</td>
                            <td style={{ fontWeight: 600 }}>{t.totalDistance} km</td>
                            <td><span className={`status-pill ${t.status.toLowerCase()}`}>{t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* CHECKINS REPORT VIEW */}
                  {reportType === 'checkins' && (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Log ID</th>
                          <th>Driver Name</th>
                          <th>Vehicle</th>
                          <th>Date / Time</th>
                          <th>Odometer</th>
                          <th>Condition</th>
                          <th>Fuel Filled</th>
                          <th>Engine / Tyre</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600 }}>LOG-0{c.id}</td>
                            <td>{c.driverName}</td>
                            <td>{c.vehicleNumber}</td>
                            <td>
                              <div>{c.checkinDate}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.checkinTime}</div>
                            </td>
                            <td>{c.odometerReading.toLocaleString()} km</td>
                            <td><span className={`status-pill ${c.vehicleCondition.toLowerCase().replace(' ', '')}`}>{c.vehicleCondition}</span></td>
                            <td>{c.fuelFilled > 0 ? `${c.fuelFilled} L` : '0 L'}</td>
                            <td>
                              <div style={{ fontSize: '0.8rem' }}>Eng: {c.engineStatus}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tyre: {c.tyreCondition}</div>
                            </td>
                            <td style={{ maxWidth: '150px', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem' }}>
                              {c.remarks || 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* FUEL REPORT VIEW */}
                  {reportType === 'fuel' && (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Fuel Refill ID</th>
                          <th>Driver Name</th>
                          <th>Vehicle Number</th>
                          <th>Logging Date / Time</th>
                          <th>Fuel Volume (Litres)</th>
                          <th>Odometer (KM)</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map(f => (
                          <tr key={f.id}>
                            <td style={{ fontWeight: 600 }}>FUEL-0{f.id}</td>
                            <td>{f.driverName}</td>
                            <td style={{ fontWeight: 600 }}>{f.vehicleNumber}</td>
                            <td>{f.date} ({f.time})</td>
                            <td style={{ fontWeight: 700, color: 'var(--warning-color)' }}>{f.fuelFilled} L</td>
                            <td>{f.odometerReading.toLocaleString()} km</td>
                            <td>{f.remarks || 'Standard refill'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <EmptyState 
                  title="No Report Results" 
                  description="No operation entries match your set filter parameters. Try expanding your dates or clearing inputs."
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Printable Area styling (Hidden in screen mode, active in print mode) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .custom-table, .custom-table * {
            visibility: visible;
          }
          .custom-table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 1px solid #000;
          }
          .custom-table th {
            background-color: #f1f1f1 !important;
            color: #000 !important;
            border-bottom: 2px solid #000 !important;
          }
          .custom-table td {
            border-bottom: 1px solid #ddd !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
