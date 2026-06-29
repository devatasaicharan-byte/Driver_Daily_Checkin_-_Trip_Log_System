const db = require('../config/connection');

const CheckinModel = {
  findAll: async () => {
    return await db.query('SELECT * FROM checkins ORDER BY id DESC');
  },

  findByDriverAndDate: async (driverId, checkinDate) => {
    const rows = await db.query(
      'SELECT * FROM checkins WHERE driverId = ? AND checkinDate = ?',
      [driverId, checkinDate]
    );
    return rows[0] || null;
  },

  create: async ({
    driverId,
    driverName,
    vehicleId,
    vehicleNumber,
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
  }) => {
    const result = await db.query(
      'INSERT INTO checkins (driverId, driverName, vehicleId, vehicleNumber, checkinDate, checkinTime, vehicleCondition, fuelFilled, odometerReading, engineStatus, tyreCondition, batteryStatus, remarks, vehicleImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        driverId,
        driverName,
        vehicleId,
        vehicleNumber,
        checkinDate,
        checkinTime,
        vehicleCondition,
        fuelFilled || 0,
        odometerReading,
        engineStatus,
        tyreCondition,
        batteryStatus,
        remarks || '',
        vehicleImageUrl || ''
      ]
    );
    return result.insertId;
  }
};

module.exports = CheckinModel;
