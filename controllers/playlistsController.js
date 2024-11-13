// controllers/playlistsController.js
const axios = require('axios');
const { getValidAccessToken } = require('../util/tokenHelper');

exports.getUserPlaylists = async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).send('User not authenticated');
    }

    try {
        const accessToken = await getValidAccessToken(req.sessionID);
        req.session.reload((err) => {
            if (err) {
                console.error('Error reloading session:', err);
                return res.status(500).json({ error: 'Failed to reload session data' });
            }
        });
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching playlists:', error.message);
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
};

exports.getPlaylistTracks = async (req, res) => {
    const accessToken = await getValidAccessToken(req.sessionID);
    req.session.reload((err) => {
        if (err) {
            console.error('Error reloading session:', err);
            return res.status(500).json({ error: 'Failed to reload session data' });
        }
    });
    const playlistId = req.params.playlist_id;

    if (!accessToken) {
        return res.status(401).send('User not authenticated');
    }

    try {
        let allTracks = [];
        let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

        // Loop through paginated results
        while (nextUrl) {
            const response = await axios.get(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            allTracks = allTracks.concat(response.data.items);  // Append fetched tracks to allTracks
            nextUrl = response.data.next;  // Get the next URL, if available
        }

        // Fetch playlist details (like name) separately
        const playlistDetailsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        res.json({
            name: playlistDetailsResponse.data.name,  // Playlist name
            items: allTracks  // All fetched track items
        });
    } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        res.status(500).send('Error fetching playlist tracks');
    }
};