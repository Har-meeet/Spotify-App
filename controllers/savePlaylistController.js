// controllers/savePlaylistController.js
const axios = require('axios');
const { getValidAccessToken } = require('../util/tokenHelper');

exports.savePlaylist = async (req, res) => {
    const accessToken = await getValidAccessToken(req.sessionID);

    const { playlistId, name, trackIds } = req.body;

    if (!accessToken) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        // Step 1: Create a new playlist in the user's account
        const createPlaylistResponse = await axios.post(
            'https://api.spotify.com/v1/me/playlists',
            {
                name,
                description: "Generated playlist based on your selected tracks",
                public: false,
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        const newPlaylistId = createPlaylistResponse.data.id;

        // Step 2: Add generated tracks to the new playlist in batches of 100
        const trackUris = trackIds.map(id => `spotify:track:${id}`);
        for (let i = 0; i < trackUris.length; i += 100) {
            const urisBatch = trackUris.slice(i, i + 100);
            await axios.post(
                `https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`,
                { uris: urisBatch },
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
        }

        res.status(200).json({ message: 'Playlist saved successfully', playlistId: newPlaylistId });
    } catch (error) {
        console.error('Error saving playlist:', error);
        res.status(500).json({ error: 'Failed to save playlist' });
    }
};
