const DriverModel = require('../models/driverModel');

const DriverController = {
  getAllDrivers: async (req, res) => {
    try {
      const drivers = await DriverModel.findAll();
      return res.status(200).json({ success: true, data: drivers });
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch drivers' });
    }
  },

  getDriverById: async (req, res) => {
    try {
      const driver = await DriverModel.findById(req.params.id);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }
      return res.status(200).json({ success: true, data: driver });
    } catch (error) {
      console.error('Error fetching driver:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch driver' });
    }
  },

  createDriver: async (req, res) => {
    try {
      const { driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status } = req.body;

      if (!driverName || !driverId || !phone || !licenseNumber || !licenseExpiry || !joiningDate) {
        return res.status(400).json({ success: false, message: 'All driver fields are mandatory' });
      }

      // Check for duplicate driverId
      const existing = await DriverModel.findByDriverId(driverId);
      if (existing) {
        return res.status(400).json({ success: false, message: `Driver ID ${driverId} already exists` });
      }

      const id = await DriverModel.create({
        driverName,
        driverId,
        phone,
        licenseNumber,
        licenseExpiry,
        joiningDate,
        experience: parseInt(experience) || 0,
        status
      });

      return res.status(201).json({
        success: true,
        message: 'Driver added successfully',
        data: { id, driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status }
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      return res.status(500).json({ success: false, message: 'Failed to create driver' });
    }
  },

  updateDriver: async (req, res) => {
    try {
      const { driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status } = req.body;
      const { id } = req.params;

      const driver = await DriverModel.findById(id);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      if (!driverName || !driverId || !phone || !licenseNumber || !licenseExpiry || !joiningDate) {
        return res.status(400).json({ success: false, message: 'All driver fields are mandatory' });
      }

      // Check for duplicate driverId (excluding current driver)
      const existing = await DriverModel.findByDriverId(driverId);
      if (existing && existing.id != id) {
        return res.status(400).json({ success: false, message: `Driver ID ${driverId} is assigned to another driver` });
      }

      await DriverModel.update(id, {
        driverName,
        driverId,
        phone,
        licenseNumber,
        licenseExpiry,
        joiningDate,
        experience: parseInt(experience) || 0,
        status
      });

      return res.status(200).json({ success: true, message: 'Driver updated successfully' });
    } catch (error) {
      console.error('Error updating driver:', error);
      return res.status(500).json({ success: false, message: 'Failed to update driver' });
    }
  },

  deleteDriver: async (req, res) => {
    try {
      const { id } = req.params;
      const driver = await DriverModel.findById(id);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      await DriverModel.delete(id);
      return res.status(200).json({ success: true, message: 'Driver deleted successfully' });
    } catch (error) {
      console.error('Error deleting driver:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete driver' });
    }
  }
};

module.exports = DriverController;
