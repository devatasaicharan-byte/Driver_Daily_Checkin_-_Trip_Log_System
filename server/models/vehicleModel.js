const db = require('../config/connection');

const VehicleModel = {
  findAll: async () => {
    return await db.query('SELECT * FROM vehicles ORDER BY id DESC');
  },

  findById: async (id) => {
    const rows = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findByVehicleNumber: async (vehicleNumber) => {
    const rows = await db.query('SELECT * FROM vehicles WHERE vehicleNumber = ?', [vehicleNumber]);
    return rows[0] || null;
  },

  create: async ({ vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status }) => {
    const result = await db.query(
      'INSERT INTO vehicles (vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId || null, status || 'Available']
    );
    return result.insertId;
  },

  update: async (id, { vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId, status }) => {
    await db.query(
      'UPDATE vehicles SET vehicleNumber = ?, vehicleType = ?, model = ?, insuranceExpiry = ?, fitnessCertificate = ?, rcNumber = ?, assignedDriverId = ?, status = ? WHERE id = ?',
      [vehicleNumber, vehicleType, model, insuranceExpiry, fitnessCertificate, rcNumber, assignedDriverId || null, status, id]
    );
    return true;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE vehicles SET status = ? WHERE id = ?', [status, id]);
    return true;
  },

  delete: async (id) => {
    await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
    return true;
  }
};

module.exports = VehicleModel;
