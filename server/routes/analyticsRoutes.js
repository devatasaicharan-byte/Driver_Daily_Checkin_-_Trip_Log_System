const express = require('express');
const AnalyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/dashboard', verifyToken, AnalyticsController.getDashboardStats);
router.get('/driver', verifyToken, AnalyticsController.getDriverDashboardStats);

module.exports = router;
