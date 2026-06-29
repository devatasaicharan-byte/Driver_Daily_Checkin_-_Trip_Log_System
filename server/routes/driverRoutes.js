const express = require('express');
const DriverController = require('../controllers/driverController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, DriverController.getAllDrivers);
router.get('/:id', verifyToken, DriverController.getDriverById);
router.post('/', verifyToken, requireAdmin, DriverController.createDriver);
router.put('/:id', verifyToken, requireAdmin, DriverController.updateDriver);
router.delete('/:id', verifyToken, requireAdmin, DriverController.deleteDriver);

module.exports = router;
