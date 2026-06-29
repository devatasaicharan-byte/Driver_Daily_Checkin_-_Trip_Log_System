const TripModel = require('../models/tripModel');
const CheckinModel = require('../models/checkinModel');
const DriverModel = require('../models/driverModel');
const VehicleModel = require('../models/vehicleModel');

const AnalyticsController = {
  getDashboardStats: async (req, res) => {
    try {
      const trips = await TripModel.findAll();
      const checkins = await CheckinModel.findAll();
      const drivers = await DriverModel.findAll();
      const vehicles = await VehicleModel.findAll();

      // Calculations for summary cards
      const totalDrivers = drivers.length;
      const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
      const activeTrips = trips.filter(t => t.status === 'Started').length;
      const completedTrips = trips.filter(t => t.status === 'Completed').length;

      // Fuel entries today
      const todayStr = new Date().toISOString().split('T')[0];
      const fuelToday = checkins
        .filter(c => c.checkinDate === todayStr && c.fuelFilled > 0)
        .reduce((sum, c) => sum + parseFloat(c.fuelFilled || 0), 0);

      // Pending Checkins: Drivers who haven't checked in today yet
      const checkedInDriverIds = checkins
        .filter(c => c.checkinDate === todayStr)
        .map(c => c.driverId);
      
      const pendingCheckins = drivers.filter(d => !checkedInDriverIds.includes(d.id) && d.status !== 'Inactive').length;

      // 1. Trips per day (Last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const tripsPerDay = last7Days.map(date => {
        const count = trips.filter(t => t.tripDate === date).length;
        return { date, count };
      });

      // 2. Monthly Trips
      const monthlyMap = {};
      trips.forEach(t => {
        if (t.tripDate) {
          const month = t.tripDate.substring(0, 7); // YYYY-MM
          monthlyMap[month] = (monthlyMap[month] || 0) + 1;
        }
      });
      const monthlyTrips = Object.keys(monthlyMap)
        .sort()
        .map(month => ({ month, count: monthlyMap[month] }));

      // 3. Vehicle Usage (Completed/Active trips count per vehicle number)
      const vehicleUsageMap = {};
      trips.forEach(t => {
        if (t.vehicleNumber) {
          vehicleUsageMap[t.vehicleNumber] = (vehicleUsageMap[t.vehicleNumber] || 0) + 1;
        }
      });
      const vehicleUsage = Object.keys(vehicleUsageMap).map(num => ({
        vehicleNumber: num,
        tripCount: vehicleUsageMap[num]
      }));

      // 4. Fuel Consumption (Liters filled per vehicle number)
      const fuelMap = {};
      checkins.forEach(c => {
        if (c.vehicleNumber && c.fuelFilled > 0) {
          fuelMap[c.vehicleNumber] = (fuelMap[c.vehicleNumber] || 0) + parseFloat(c.fuelFilled);
        }
      });
      const fuelConsumption = Object.keys(fuelMap).map(num => ({
        vehicleNumber: num,
        totalFuel: parseFloat(fuelMap[num].toFixed(2))
      }));

      // 5. Driver Performance (Completed trips vs total distance)
      const driverPerformanceMap = {};
      // Initialize with all drivers
      drivers.forEach(d => {
        driverPerformanceMap[d.driverName] = { completed: 0, distance: 0 };
      });

      trips.forEach(t => {
        if (t.status === 'Completed' && t.driverName) {
          if (!driverPerformanceMap[t.driverName]) {
            driverPerformanceMap[t.driverName] = { completed: 0, distance: 0 };
          }
          driverPerformanceMap[t.driverName].completed += 1;
          driverPerformanceMap[t.driverName].distance += parseFloat(t.totalDistance || 0);
        }
      });

      const driverPerformance = Object.keys(driverPerformanceMap).map(name => ({
        driverName: name,
        completedTrips: driverPerformanceMap[name].completed,
        totalDistance: parseFloat(driverPerformanceMap[name].distance.toFixed(1))
      }));

      // 6. Completed vs Active vs Cancelled vs Pending
      const tripStatusCounts = {
        Completed: trips.filter(t => t.status === 'Completed').length,
        Started: trips.filter(t => t.status === 'Started').length,
        Pending: trips.filter(t => t.status === 'Pending').length,
        Cancelled: trips.filter(t => t.status === 'Cancelled').length
      };

      return res.status(200).json({
        success: true,
        summary: {
          totalDrivers,
          availableVehicles,
          activeTrips,
          completedTrips,
          fuelToday: parseFloat(fuelToday.toFixed(2)),
          pendingCheckins
        },
        charts: {
          tripsPerDay,
          monthlyTrips,
          vehicleUsage,
          fuelConsumption,
          driverPerformance,
          tripStatusCounts
        }
      });
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      return res.status(500).json({ success: false, message: 'Failed to compile dashboard statistics' });
    }
  },

  getDriverDashboardStats: async (req, res) => {
    try {
      // Find driver profile linking user ID
      const driver = await DriverModel.findByUserId(req.user.id);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      const trips = await TripModel.findAll();
      const checkins = await CheckinModel.findAll();
      const vehicles = await VehicleModel.findAll();

      const myTrips = trips.filter(t => t.driverId === driver.id);
      const myCheckins = checkins.filter(c => c.driverId === driver.id);
      const myVehicle = vehicles.find(v => v.assignedDriverId === driver.id) || null;

      // Stats
      const totalTrips = myTrips.length;
      const completedTrips = myTrips.filter(t => t.status === 'Completed').length;
      const activeTrip = myTrips.find(t => t.status === 'Started') || null;
      const upcomingTrips = myTrips.filter(t => t.status === 'Pending');
      const totalDistance = myTrips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + parseFloat(t.totalDistance || 0), 0);

      // Checkin today status
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCheckin = myCheckins.find(c => c.checkinDate === todayStr) || null;

      // Last 5 trips
      const recentTrips = myTrips.slice(0, 5);

      return res.status(200).json({
        success: true,
        data: {
          driver,
          myVehicle,
          stats: {
            totalTrips,
            completedTrips,
            totalDistance: parseFloat(totalDistance.toFixed(1)),
            isCheckedInToday: !!todayCheckin,
            todayCheckin
          },
          activeTrip,
          upcomingTrips,
          recentTrips
        }
      });
    } catch (error) {
      console.error('Error fetching driver dashboard stats:', error);
      return res.status(500).json({ success: false, message: 'Failed to compile driver analytics' });
    }
  }
};

module.exports = AnalyticsController;
