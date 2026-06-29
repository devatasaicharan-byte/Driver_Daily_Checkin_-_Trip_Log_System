const TripModel = require('../models/tripModel');
const CheckinModel = require('../models/checkinModel');

const ReportController = {
  getReportData: async (req, res) => {
    try {
      const { type, driverId, vehicleId, startDate, endDate } = req.query;

      let data = [];

      if (type === 'trips' || !type) {
        const trips = await TripModel.findAll();
        data = trips.filter(trip => {
          let matches = true;
          if (driverId && trip.driverId != driverId) matches = false;
          if (vehicleId && trip.vehicleId != vehicleId) matches = false;
          if (startDate && trip.tripDate < startDate) matches = false;
          if (endDate && trip.tripDate > endDate) matches = false;
          return matches;
        });
      } else if (type === 'fuel') {
        const checkins = await CheckinModel.findAll();
        // Fuel is logged in checkins
        data = checkins
          .filter(c => c.fuelFilled > 0)
          .filter(c => {
            let matches = true;
            if (driverId && c.driverId != driverId) matches = false;
            if (vehicleId && c.vehicleId != vehicleId) matches = false;
            if (startDate && c.checkinDate < startDate) matches = false;
            if (endDate && c.checkinDate > endDate) matches = false;
            return matches;
          })
          .map(c => ({
            id: c.id,
            driverName: c.driverName,
            vehicleNumber: c.vehicleNumber,
            date: c.checkinDate,
            time: c.checkinTime,
            fuelFilled: c.fuelFilled,
            odometerReading: c.odometerReading,
            remarks: c.remarks
          }));
      } else if (type === 'checkins') {
        const checkins = await CheckinModel.findAll();
        data = checkins.filter(c => {
          let matches = true;
          if (driverId && c.driverId != driverId) matches = false;
          if (vehicleId && c.vehicleId != vehicleId) matches = false;
          if (startDate && c.checkinDate < startDate) matches = false;
          if (endDate && c.checkinDate > endDate) matches = false;
          return matches;
        });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error compiling report data:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate report data' });
    }
  }
};

module.exports = ReportController;
