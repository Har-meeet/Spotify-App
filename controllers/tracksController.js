// controllers/tracksController.js
const axios = require('axios');
const { getValidAccessToken } = require('../util/tokenHelper');

exports.getTrack = async (req, res) => {
    const accessToken = await getValidAccessToken(req.session.user_id);
    req.session.access_token = accessToken;
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