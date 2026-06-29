const express = require('express');
const CheckinController = require('../controllers/checkinController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, CheckinController.getAllCheckins);
router.post('/', verifyToken, CheckinController.createCheckin);

module.exports = router;
