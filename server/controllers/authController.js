const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'manivtha_tours_travels_secret_jwt_key_2026';

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, phone } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      const db = require('../config/connection');
      
      // Update users table
      await db.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);

      // If user is a driver, also update driver profile contact details
      if (req.user.role === 'driver') {
        if (!phone) {
          return res.status(400).json({ success: false, message: 'Phone number is required for drivers' });
        }
        await db.query('UPDATE drivers SET driverName = ?, phone = ? WHERE userId = ?', [name, phone, userId]);
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current password and new password are required' });
      }

      // Fetch user profile
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password entered is incorrect' });
      }

      // Hash and update password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const db = require('../config/connection');
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('getMe error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = AuthController;
