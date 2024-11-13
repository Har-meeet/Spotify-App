// Track.js
import { fetchAccessToken } from '../api';

export default class Track {
    constructor(id, name, artist, imageUrl) {
        this.id = id;
        this.name = name;
        this.artist = artist;
        this.imageUrl = imageUrl;
        this.isPlaying = false;
    }

    async playTrack(accessTokenObject) {
        const playUrl = `https://api.spotify.com/v1/me/player/play`;
        const pauseUrl = `https://api.spotify.com/v1/me/player/pause`;

        try {
            const accessToken = await checkAccessToken(accessTokenObject);

            if (this.isPlaying) {
                // Pause track if it's currently playing
                await fetch(pauseUrl, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
            } else {
                // Play the track if it’s currently paused
                await fetch(playUrl, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ uris: [`spotify:track:${this.id}`] })
                });
            }
            // Toggle play state after successful request
            this.isPlaying = !this.isPlaying;
        } catch (error) {
            console.error("Error playing/pausing track:", error);
        }
    }

    async onEnd(callback, accessTokenObject) {
        const accessToken = await checkAccessToken(accessTokenObject);
        // Poll Spotify for playback status every second to detect end of track
        const interval = setInterval(async () => {
            const state = await this.getPlaybackState(accessToken);
            if (state && !state.is_playing && this.isPlaying) {
                this.isPlaying = false;
                clearInterval(interval);
                callback(); // Proceed to next track
            }
        }, 1000);
    }

    async getPlaybackState(accessToken) {
        const url = `https://api.spotify.com/v1/me/player`;
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Error fetching playback state:", error);
        }
        return null;
    }
}

async function checkAccessToken(accessTokenObject) {
    let accessToken = accessTokenObject.access_token;
    const expiresIn = new Date(accessTokenObject.expires_in);
    const currentTime = new Date();

    // Refresh token if it's close to expiry
    if (currentTime >= expiresIn - 300000) {
        accessTokenObject = await fetchAccessToken();
        accessToken = accessTokenObject.access_token;
    }
    return accessToken;
}
