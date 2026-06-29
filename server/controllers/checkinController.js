const CheckinModel = require('../models/checkinModel');
const DriverModel = require('../models/driverModel');
const VehicleModel = require('../models/vehicleModel');

const CheckinController = {
  getAllCheckins: async (req, res) => {
    try {
      const checkins = await CheckinModel.findAll();
      return res.status(200).json({ success: true, data: checkins });
    } catch (error) {
      console.error('Error fetching checkins:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch check-ins' });
    }
  },

  createCheckin: async (req, res) => {
    try {
      let {
        driverId,
        vehicleId,
        checkinDate,
        checkinTime,
        vehicleCondition,
        fuelFilled,
        odometerReading,
        engineStatus,
        tyreCondition,
        batteryStatus,
        remarks,
        vehicleImageUrl
      } = req.body;

      // If user is driver, enforce their own driverId
      if (req.user && req.user.role === 'driver') {
        const driverProfile = await DriverModel.findByUserId(req.user.id);
        if (!driverProfile) {
          return res.status(404).json({ success: false, message: 'Driver profile not found' });
        }
        driverId = driverProfile.id;
      }

      // 1. Validation: Vehicle condition is mandatory
      if (!vehicleCondition) {
        return res.status(400).json({ success: false, message: 'Vehicle condition is mandatory' });
      }

      if (!driverId || !vehicleId || !checkinDate || !checkinTime || !odometerReading || !engineStatus || !tyreCondition || !batteryStatus) {
        return res.status(400).json({ success: false, message: 'All form checklist fields are required' });
      }

      // 2. Validation: Fuel entered must be greater than zero if entered
      const fuelVal = parseFloat(fuelFilled);
      if (fuelFilled !== undefined && fuelFilled !== '' && isNaN(fuelVal)) {
        return res.status(400).json({ success: false, message: 'Fuel filled must be a valid number' });
      }
      if (fuelVal <= 0) {
        return res.status(400).json({ success: false, message: 'Fuel entered must be greater than zero' });
      }

      const odometerVal = parseInt(odometerReading);
      if (isNaN(odometerVal) || odometerVal <= 0) {
        return res.status(400).json({ success: false, message: 'Odometer reading must be a positive integer' });
      }

      // Fetch driver and vehicle names
      const driver = await DriverModel.findById(driverId);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      const vehicle = await VehicleModel.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      // 3. Validation: A driver cannot check in twice on the same day
      const existingCheckin = await CheckinModel.findByDriverAndDate(driverId, checkinDate);
      if (existingCheckin) {
        return res.status(400).json({
          success: false,
          message: `Driver ${driver.driverName} has already checked in today (${checkinDate})`
        });
      }

      // Insert check-in log
      const insertId = await CheckinModel.create({
        driverId,
        driverName: driver.driverName,
        vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        checkinDate,
        checkinTime,
        vehicleCondition,
        fuelFilled: fuelVal || 0,
        odometerReading: odometerVal,
        engineStatus,
        tyreCondition,
        batteryStatus,
        remarks,
        vehicleImageUrl
      });

      // Update statuses: set driver and vehicle to Available
      await DriverModel.updateStatus(driverId, 'Available');
      await VehicleModel.updateStatus(vehicleId, 'Available');

      return res.status(201).json({
        success: true,
        message: 'Driver daily check-in logged successfully',
        data: { id: insertId }
      });
    } catch (error) {
      console.error('Error creating check-in:', error);
      return res.status(500).json({ success: false, message: 'Failed to complete check-in log' });
    }
  }
};

module.exports = CheckinController;
