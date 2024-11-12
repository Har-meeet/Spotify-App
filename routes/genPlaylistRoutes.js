// routes/generatePlaylistRoutes.js
const express = require('express');
const router = express.Router();
const generatePlaylistController = require('../controllers/genPlaylistController');

// Route to generate a custom playlist
router.post('/:playlist_id', generatePlaylistController.generatePlaylist);

module.exports = router;