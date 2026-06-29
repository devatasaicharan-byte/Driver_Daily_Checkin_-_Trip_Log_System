const TripModel = require('../models/tripModel');
const DriverModel = require('../models/driverModel');
const VehicleModel = require('../models/vehicleModel');

const TripController = {
  getAllTrips: async (req, res) => {
    try {
      let trips = [];
      if (req.user && req.user.role === 'driver') {
        const driver = await DriverModel.findByUserId(req.user.id);
        if (driver) {
          trips = await TripModel.findByDriverId(driver.id);
        }
      } else {
        trips = await TripModel.findAll();
      }
      return res.status(200).json({ success: true, data: trips });
    } catch (error) {
      console.error('Error fetching trips:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch trips' });
    }
  },

  createTrip: async (req, res) => {
    try {
      const {
        driverId,
        vehicleId,
        pickupLocation,
        destination,
        customerName,
        tripDate,
        startTime,
        startingKm,
        status // 'Pending' or 'Started'
      } = req.body;

      if (!driverId || !vehicleId || !pickupLocation || !destination || !customerName || !tripDate || !startTime || !startingKm) {
        return res.status(400).json({ success: false, message: 'All trip fields are required' });
      }

      const startKmVal = parseInt(startingKm);
      if (isNaN(startKmVal) || startKmVal < 0) {
        return res.status(400).json({ success: false, message: 'Starting KM must be a non-negative number' });
      }

      const driver = await DriverModel.findById(driverId);
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      const vehicle = await VehicleModel.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      // Business Rule: A vehicle cannot start another trip while already on an active trip
      const activeTrip = await TripModel.findActiveByVehicleId(vehicleId);
      if (activeTrip && (status === 'Started' || !status)) {
        return res.status(400).json({
          success: false,
          message: `Vehicle ${vehicle.vehicleNumber} is currently on an active trip and cannot start another`
        });
      }

      // Create the trip
      const finalStatus = status || 'Started';
      const insertId = await TripModel.create({
        driverId,
        driverName: driver.driverName,
        vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        pickupLocation,
        destination,
        customerName,
        tripDate,
        startTime,
        startingKm: startKmVal,
        status: finalStatus
      });

      // If trip is 'Started', update driver and vehicle statuses to 'On Trip'
      if (finalStatus === 'Started') {
        await DriverModel.updateStatus(driverId, 'On Trip');
        await VehicleModel.updateStatus(vehicleId, 'On Trip');
      }

      return res.status(201).json({
        success: true,
        message: `Trip ${finalStatus === 'Started' ? 'started' : 'scheduled'} successfully`,
        data: { id: insertId }
      });
    } catch (error) {
      console.error('Error creating trip:', error);
      return res.status(500).json({ success: false, message: 'Failed to create trip record' });
    }
  },

  startTrip: async (req, res) => {
    try {
      const { id } = req.params;
      const trip = await TripModel.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      if (trip.status !== 'Pending') {
        return res.status(400).json({ success: false, message: `Trip is already ${trip.status.toLowerCase()}` });
      }

      // Verify vehicle availability
      const activeTrip = await TripModel.findActiveByVehicleId(trip.vehicleId);
      if (activeTrip) {
        return res.status(400).json({
          success: false,
          message: `Vehicle ${trip.vehicleNumber} is currently on an active trip`
        });
      }

      // Update status
      await TripModel.updateStatus(id, 'Started');
      await DriverModel.updateStatus(trip.driverId, 'On Trip');
      await VehicleModel.updateStatus(trip.vehicleId, 'On Trip');

      return res.status(200).json({ success: true, message: 'Trip started successfully' });
    } catch (error) {
      console.error('Error starting trip:', error);
      return res.status(500).json({ success: false, message: 'Failed to start trip' });
    }
  },

  completeTrip: async (req, res) => {
    try {
      const { id } = req.params;
      const { endingKm, endTime } = req.body;

      if (!endingKm || !endTime) {
        return res.status(400).json({ success: false, message: 'Ending KM and End Time are required to complete a trip' });
      }

      const trip = await TripModel.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      if (trip.status !== 'Started') {
        return res.status(400).json({ success: false, message: 'Only active/started trips can be completed' });
      }

      const endKmVal = parseInt(endingKm);
      const startKmVal = parseInt(trip.startingKm);

      // Business Rule: Ending KM must always be greater than Starting KM
      if (endKmVal <= startKmVal) {
        return res.status(400).json({
          success: false,
          message: `Ending KM (${endKmVal}) must be greater than Starting KM (${startKmVal})`
        });
      }

      // Distance should be calculated automatically
      const totalDistance = endKmVal - startKmVal;

      await TripModel.update(id, {
        endTime,
        endingKm: endKmVal,
        totalDistance,
        status: 'Completed'
      });

      // Free driver and vehicle
      await DriverModel.updateStatus(trip.driverId, 'Available');
      await VehicleModel.updateStatus(trip.vehicleId, 'Available');

      return res.status(200).json({
        success: true,
        message: 'Trip completed successfully',
        data: { totalDistance }
      });
    } catch (error) {
      console.error('Error completing trip:', error);
      return res.status(500).json({ success: false, message: 'Failed to complete trip' });
    }
  },

  cancelTrip: async (req, res) => {
    try {
      const { id } = req.params;
      const trip = await TripModel.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }

      if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        return res.status(400).json({ success: false, message: `Cannot cancel a trip that is already ${trip.status.toLowerCase()}` });
      }

      await TripModel.updateStatus(id, 'Cancelled');

      // Free driver and vehicle
      await DriverModel.updateStatus(trip.driverId, 'Available');
      await VehicleModel.updateStatus(trip.vehicleId, 'Available');

      return res.status(200).json({ success: true, message: 'Trip cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling trip:', error);
      return res.status(500).json({ success: false, message: 'Failed to cancel trip' });
    }
  }
};

module.exports = TripController;
