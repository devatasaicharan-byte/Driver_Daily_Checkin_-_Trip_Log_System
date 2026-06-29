const express = require('express');
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', verifyToken, AuthController.getMe);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/update-profile', verifyToken, AuthController.updateProfile);

module.exports = router;
