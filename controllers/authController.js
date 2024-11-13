// controllers/authController.js
const axios = require('axios');
const { getValidAccessToken } = require('../util/tokenHelper');

exports.accessToken = async (req, res) => {
    accessToken = await getValidAccessToken(req.sessionID);
    req.session.reload((err) => {
        if (err) {
            console.error('Error reloading session:', err);
            return res.status(500).json({ error: 'Failed to reload session data' });
        } else {
            res.json({ access_token: accessToken, expires_in: req.session.expires_in });
        }
    });
}

exports.login = (req, res) => {
const scopes = 'playlist-read-private playlist-modify-private user-library-read user-modify-playback-state user-read-playback-state';
const forceLogin = req.query.force_login === 'true';
const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;
const authUrl = `${spotifyAuthUrl}${forceLogin ? '&show_dialog=true' : ''}`;
    
    res.redirect(authUrl);
};


exports.checkSession = (req, res) => {
    if (req.session && req.session.user_id) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
};

exports.callback = async (req, res) => {
    const code = req.query.code || null;
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    const data = new URLSearchParams({
        code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
    });

    const authOptions = {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    try {
        const response = await axios.post(tokenUrl, data.toString(), authOptions);
        const { access_token, refresh_token, expires_in } = response.data;

        // Fetch user profile to get user ID
        const userProfile = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const user_id = userProfile.data.id;
        const tokenExpiry = new Date(Date.now() + expires_in * 1000);

        // Store tokens and user_id in the session
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;
        req.session.expires_in = tokenExpiry;
        req.session.user_id = user_id;

        res.redirect(`http://localhost:3000?user_id=${user_id}`);
    } catch (error) {
        console.error('Error during Spotify authorization:', error);
        res.status(500).send('Authentication error');
    }
};