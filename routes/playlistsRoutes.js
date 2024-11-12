// routes/playlistsRoutes.js
const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistsController');

// Route to get all user playlists
router.get('/', playlistController.getUserPlaylists);

// Route to get tracks in a specific playlist
router.get('/:playlist_id', playlistController.getPlaylistTracks);

module.exports = router;