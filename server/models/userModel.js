const db = require('../config/connection');

const UserModel = {
  findByEmail: async (email) => {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const rows = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  create: async ({ name, email, password, role }) => {
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'staff']
    );
    return result.insertId;
  }
};

module.exports = UserModel;
