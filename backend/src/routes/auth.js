const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Google OAuth routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// Profile routes (protected)
router.get('/profile', authenticate, authController.getProfile);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;

