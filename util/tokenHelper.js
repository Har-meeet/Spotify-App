// util/tokenHelper.js
const axios = require('axios');
const pool = require('../db/mysqlConnection');

// Helper function to check and refresh access token if needed
async function getValidAccessToken(sessionId) {
    try {
        // Fetch the session data JSON from the database using session_id
        const [rows] = await pool.query(
            'SELECT data FROM sessions WHERE session_id = ?',
            [sessionId]
        );

        if (rows.length === 0) {
            throw new Error('Session not found in the database');
        }

        // Parse the JSON data to extract tokens and expiry information
        const sessionData = JSON.parse(rows[0].data);
        const { access_token: accessToken, refresh_token: refreshToken, expires_in: tokenExpiry, user_id: userId } = sessionData;

        const currentTime = new Date();
        const expiryTime = new Date(tokenExpiry);
        const timeRemaining = expiryTime - currentTime;

        // Check if the token is still valid
        if (timeRemaining > process.env.REQUEST_TOKEN_BUFFER) {
            return accessToken;
        }

        // If the token is expired or close to expiry, refresh it
        const newAccessToken = await refreshAccessToken(refreshToken, sessionId);

        return newAccessToken;

    } catch (error) {
        console.error('Error validating access token:', error);
        throw error;
    }
}


async function refreshAccessToken(refreshToken, sessionId) {
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

        // Fetch and update the session data in JSON format
        const [rows] = await pool.query(
            'SELECT data FROM sessions WHERE session_id = ?',
            [sessionId]
        );

        if (rows.length === 0) {
            throw new Error('Session not found in the database');
        }

        // Parse and update the session data
        const sessionData = JSON.parse(rows[0].data);
        sessionData.access_token = newAccessToken;
        sessionData.expires_in = newExpiryTime;

        // Save the updated session data back to the database
        await pool.query(
            `UPDATE sessions SET data = ? WHERE session_id = ?`,
            [JSON.stringify(sessionData), sessionId]
        );

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}


module.exports = { getValidAccessToken };