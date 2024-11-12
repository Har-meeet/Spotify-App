// routes/savePlaylistRoutes.js
const express = require('express');
const router = express.Router();
const savePlaylistController = require('../controllers/savePlaylistController');

// Route to save a generated playlist to Spotify
router.post('/', savePlaylistController.savePlaylist);

module.exports = router;