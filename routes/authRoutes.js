// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route for logging in
router.get('/login', authController.login);

// Route for handling callback after Spotify authentication
router.get('/callback', authController.callback);

// Route for checking if the user is authenticated
router.get('/check-session', authController.checkSession);

router.get('/access-token', authController.accessToken);
module.exports = router;