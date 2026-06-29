const db = require('../config/connection');

const DriverModel = {
  findAll: async () => {
    return await db.query('SELECT * FROM drivers ORDER BY id DESC');
  },

  findById: async (id) => {
    const rows = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findByUserId: async (userId) => {
    const rows = await db.query('SELECT * FROM drivers WHERE userId = ?', [userId]);
    return rows[0] || null;
  },

  findByDriverId: async (driverId) => {
    const rows = await db.query('SELECT * FROM drivers WHERE driverId = ?', [driverId]);
    return rows[0] || null;
  },

  create: async ({ driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status }) => {
    const result = await db.query(
      'INSERT INTO drivers (driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status || 'Available']
    );
    return result.insertId;
  },

  update: async (id, { driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status }) => {
    await db.query(
      'UPDATE drivers SET driverName = ?, driverId = ?, phone = ?, licenseNumber = ?, licenseExpiry = ?, joiningDate = ?, experience = ?, status = ? WHERE id = ?',
      [driverName, driverId, phone, licenseNumber, licenseExpiry, joiningDate, experience, status, id]
    );
    return true;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE drivers SET status = ? WHERE id = ?', [status, id]);
    return true;
  },

  delete: async (id) => {
    await db.query('DELETE FROM drivers WHERE id = ?', [id]);
    return true;
  }
};

module.exports = DriverModel;
