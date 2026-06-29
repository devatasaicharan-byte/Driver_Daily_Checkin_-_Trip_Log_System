const VehicleModel = require('../models/vehicleModel');
const DriverModel = require('../models/driverModel');

const VehicleController = {
  getAllVehicles: async (req, res) => {
    try {
      const vehicles = await VehicleModel.findAll();
      return res.status(200).json({ success: true, data: vehicles });
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
    }
  },

  getVehicleById: async (req, res) => {
    try {
      const vehicle = await VehicleModel.findById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
      return res.status(200).json({ success: true, data: vehicle });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch vehicle' });
    }
  },

  createVehicle: async (req, res) => {
    try {
      const { vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status } = req.body;

      if (!vehicleNumber || !vehicleType || !model || !insuranceExpiry || !fitnessCertificate || !rcNumber) {
        return res.status(400).json({ success: false, message: 'All vehicle fields are mandatory' });
      }

      // Check for duplicate vehicleNumber
      const existing = await VehicleModel.findByVehicleNumber(vehicleNumber);
      if (existing) {
        return res.status(400).json({ success: false, message: `Vehicle number ${vehicleNumber} already exists` });
      }

      const id = await VehicleModel.create({
        vehicleNumber,
        vehicleType,
        model,
        insuranceExpiry,
        fitnessCertificate,
        rcNumber,
        assignedDriverId: assignedDriverId ? parseInt(assignedDriverId) : null,
        status
      });

      return res.status(201).json({
        success: true,
        message: 'Vehicle added successfully',
        data: { id, vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status }
      });
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return res.status(500).json({ success: false, message: 'Failed to create vehicle' });
    }
  },

  updateVehicle: async (req, res) => {
    try {
      const { vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status } = req.body;
      const { id } = req.params;

      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      if (!vehicleNumber || !vehicleType || !model || !insuranceExpiry || !fitnessCertificate || !rcNumber) {
        return res.status(400).json({ success: false, message: 'All vehicle fields are mandatory' });
      }

      // Check duplicate (excluding current ID)
      const existing = await VehicleModel.findByVehicleNumber(vehicleNumber);
      if (existing && existing.id != id) {
        return res.status(400).json({ success: false, message: `Vehicle number ${vehicleNumber} is assigned to another vehicle` });
      }

      await VehicleModel.update(id, {
        vehicleNumber,
        vehicleType,
        model,
        insuranceExpiry,
        fitnessCertificate,
        rcNumber,
        assignedDriverId: assignedDriverId ? parseInt(assignedDriverId) : null,
        status
      });

      return res.status(200).json({ success: true, message: 'Vehicle updated successfully' });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return res.status(500).json({ success: false, message: 'Failed to update vehicle' });
    }
  },

  deleteVehicle: async (req, res) => {
    try {
      const { id } = req.params;
      const vehicle = await VehicleModel.findById(id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      await VehicleModel.delete(id);
      return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
    }
  }
};

module.exports = VehicleController;
