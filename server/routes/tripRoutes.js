const express = require('express');
const TripController = require('../controllers/tripController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, TripController.getAllTrips);
router.post('/', verifyToken, TripController.createTrip);
router.put('/:id/start', verifyToken, TripController.startTrip);
router.put('/:id/complete', verifyToken, TripController.completeTrip);
router.put('/:id/cancel', verifyToken, TripController.cancelTrip);

module.exports = router;
