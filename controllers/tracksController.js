// controllers/tracksController.js
const axios = require('axios');
const { getValidAccessToken } = require('../util/tokenHelper');

exports.getTrack = async (req, res) => {
    const accessToken = await getValidAccessToken(req.sessionID);
    req.session.reload((err) => {
        if (err) {
            console.error('Error reloading session:', err);
            return res.status(500).json({ error: 'Failed to reload session data' });
        }
    });
    const trackId = req.params.track_id;

    if (!accessToken) {
        return res.status(401).send('User not authenticated');
    }

    try {
        const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching track data:', error);
        res.status(500).send('Error fetching track data');
    }
};