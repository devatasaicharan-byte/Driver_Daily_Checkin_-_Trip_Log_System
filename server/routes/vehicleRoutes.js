const express = require('express');
const VehicleController = require('../controllers/vehicleController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, VehicleController.getAllVehicles);
router.get('/:id', verifyToken, VehicleController.getVehicleById);
router.post('/', verifyToken, requireAdmin, VehicleController.createVehicle);
router.put('/:id', verifyToken, requireAdmin, VehicleController.updateVehicle);
router.delete('/:id', verifyToken, requireAdmin, VehicleController.deleteVehicle);

module.exports = router;
