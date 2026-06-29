const express = require('express');
const ReportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, ReportController.getReportData);

module.exports = router;
