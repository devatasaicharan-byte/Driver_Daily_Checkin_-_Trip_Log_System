const db = require('../config/connection');

const TripModel = {
  findAll: async () => {
    return await db.query('SELECT * FROM trips ORDER BY id DESC');
  },

  findById: async (id) => {
    const rows = await db.query('SELECT * FROM trips WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findByDriverId: async (driverId) => {
    return await db.query('SELECT * FROM trips WHERE driverId = ? ORDER BY id DESC', [driverId]);
  },

  findActiveByVehicleId: async (vehicleId) => {
    // An active trip has a status of 'Started'
    const rows = await db.query(
      'SELECT * FROM trips WHERE vehicleId = ? AND status = ?',
      [vehicleId, 'Started']
    );
    return rows[0] || null;
  },

  create: async ({
    driverId,
    driverName,
    vehicleId,
    vehicleNumber,
    pickupLocation,
    destination,
    customerName,
    tripDate,
    startTime,
    startingKm,
    status
  }) => {
    const result = await db.query(
      'INSERT INTO trips (driverId, driverName, vehicleId, vehicleNumber, pickupLocation, destination, customerName, tripDate, startTime, startingKm, totalDistance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        driverId,
        driverName,
        vehicleId,
        vehicleNumber,
        pickupLocation,
        destination,
        customerName,
        tripDate,
        startTime,
        startingKm,
        0, // starting distance is 0
        status || 'Pending'
      ]
    );
    return result.insertId;
  },

  update: async (id, { endTime, endingKm, totalDistance, status }) => {
    await db.query(
      'UPDATE trips SET endTime = ?, endingKm = ?, totalDistance = ?, status = ? WHERE id = ?',
      [endTime, endingKm, totalDistance, status, id]
    );
    return true;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE trips SET status = ? WHERE id = ?', [status, id]);
    return true;
  }
};

module.exports = TripModel;
