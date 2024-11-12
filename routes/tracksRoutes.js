// routes/tracksRoutes.js
const express = require('express');
const router = express.Router();
const trackController = require('../controllers/tracksController');

// Route to get details of a specific track
router.get('/:track_id', trackController.getTrack);

module.exports = router;