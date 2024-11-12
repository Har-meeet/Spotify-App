// util/tokenHelper.js
const axios = require('axios');
const pool = require('../db/mysqlConnection');

// Helper function to check and refresh access token if needed
async function getValidAccessToken(userId) {
    try {
        const [rows] = await pool.query(
            'SELECT access_token, refresh_token, token_expiry FROM users WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) {
            throw new Error('User not found in the database');
        }

        let { access_token: accessToken, refresh_token: refreshToken, token_expiry: tokenExpiry } = rows[0];
        const currentTime = new Date();
        const expiryTime = new Date(tokenExpiry);
        const timeRemaining = expiryTime - currentTime;

        if (timeRemaining > process.env.REQUEST_TOKEN_BUFFER) {
            return accessToken;
        }

        // Refresh the token and update session
        const newAccessToken = await refreshAccessToken(refreshToken, userId);

        return newAccessToken;

    } catch (error) {
        console.error('Error validating access token:', error);
        throw error;
    }
}

// Function to refresh the access token
async function refreshAccessToken(refreshToken, userId) {
    const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }).toString()
    };

    try {
        const response = await axios(authOptions);
        const newAccessToken = response.data.access_token;
        const expiresIn = response.data.expires_in;

        const newExpiryTime = new Date(Date.now() + expiresIn * 1000);
        console.log(`New expiry time: ${newExpiryTime}`);

        // Update database
        await pool.query(
            `UPDATE users SET access_token = ?, token_expiry = ? WHERE user_id = ?`,
            [newAccessToken, newExpiryTime, userId]
        );

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}

module.exports = { getValidAccessToken };