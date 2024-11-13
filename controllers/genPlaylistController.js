// controllers/genPlaylistController.js
const axios = require('axios');
const { getValidAccessToken } = require('../util/tokenHelper');

async function fetchAudioFeatures(accessToken, trackIds) {
    let audioFeatures = [];
    const maxIdsPerRequest = 100; // Spotify API allows up to 100 IDs per request

    // Split track IDs into chunks if needed
    for (let i = 0; i < trackIds.length; i += maxIdsPerRequest) {
        const chunk = trackIds.slice(i, i + maxIdsPerRequest);
        const response = await axios.get("https://api.spotify.com/v1/audio-features", {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: { ids: chunk.join(',') }
        });
        audioFeatures = audioFeatures.concat(response.data.audio_features);
    }

    return audioFeatures;
}

async function getUserSavedTracks(accessToken) {
    let url = "https://api.spotify.com/v1/me/tracks";
    const tracks = new Set();

    while (url) {
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        response.data.items.forEach(item => {
            if (item.track && item.track.name && item.track.artists[0].name) {
                const trackData = `${item.track.name.toLowerCase()} - ${item.track.artists[0].name.toLowerCase()}`;
                tracks.add(trackData);
            }
        });
        url = response.data.next;
    }

    return tracks;
}

async function getUserPlaylistsAndTracks(accessToken, targetPlaylistId) {
    let url = "https://api.spotify.com/v1/me/playlists";
    const allTracks = new Set();
    const originalPlaylistTracks = [];

    while (url) {
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        for (const playlist of response.data.items) {
            const playlistId = playlist.id;
            let trackUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

            while (trackUrl) {
                const trackResponse = await axios.get(trackUrl, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                trackResponse.data.items.forEach(item => {
                    if (item.track && item.track.name && item.track.artists[0].name) {
                        const trackData = `${item.track.name.toLowerCase()} - ${item.track.artists[0].name.toLowerCase()}`;
                        allTracks.add(trackData);

                        if (playlistId === targetPlaylistId) {
                            originalPlaylistTracks.push(item.track.id);
                        }
                    }
                });

                trackUrl = trackResponse.data.next;
            }
        }

        url = response.data.next;
    }

    return { allTracks, originalPlaylistTracks };
}

function computeAverageFeatures(features) {
    const avgFeatures = features.reduce((acc, track) => {
        for (const [key, value] of Object.entries(track)) {
            if (!acc[key]) acc[key] = 0;
            acc[key] += value;
        }
        return acc;
    }, {});

    for (const key in avgFeatures) {
        avgFeatures[key] /= features.length;
    }
    return avgFeatures;
}

function adjustFeature(target, i) {
    return i % 2 === 0 ? Math.min(target + i * 0.01, 1) : Math.max(target - (i + 1) * 0.01, 0);
}

async function fetchRecommendations(accessToken, seedTracks, avgFeatures, i) {
    const params = {
        seed_tracks: seedTracks.join(','),
        target_danceability: adjustFeature(avgFeatures.danceability, i),
        target_energy: adjustFeature(avgFeatures.energy, i),
        target_valence: adjustFeature(avgFeatures.valence, i),
        target_acousticness: adjustFeature(avgFeatures.acousticness, i),
        target_instrumentalness: adjustFeature(avgFeatures.instrumentalness, i),
        target_liveness: adjustFeature(avgFeatures.liveness, i),
        target_loudness: avgFeatures.loudness,
        target_speechiness: adjustFeature(avgFeatures.speechiness, i),
        target_tempo: avgFeatures.tempo,
        limit: 100
    };

    try {
        const response = await axios.get("https://api.spotify.com/v1/recommendations", {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params
        });
        return response.data.tracks;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10);
            console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));
            return fetchRecommendations(accessToken, seedTracks, avgFeatures, i);
        }
        throw error;
    }
}

exports.generatePlaylist = async (req, res) => {
    const playlist_id = req.params.playlist_id;
    const length = req.body.length;
    const accessToken = await getValidAccessToken(req.sessionID);

    if (!accessToken) return res.status(401).send('User not authenticated');

    try {
        // Step 1: Collect all user's tracks and separate original playlist's tracks
        const savedTracks = await getUserSavedTracks(accessToken);
        const { allTracks, originalPlaylistTracks } = await getUserPlaylistsAndTracks(accessToken, playlist_id);
        savedTracks.forEach(track => allTracks.add(track));

        // Step 2: Fetch audio features for all tracks in the original playlist
        const audioFeatures = await fetchAudioFeatures(accessToken, originalPlaylistTracks);
        const avgFeatures = computeAverageFeatures(audioFeatures);

        // Step 3: Generate recommendations using cyclic seed tracks
        const recommendations = [];
        let i = 0;

        while (recommendations.length < length) {
            const seedTracks = originalPlaylistTracks.slice((5 * i) % originalPlaylistTracks.length, (5 * (i + 1)) % originalPlaylistTracks.length);
            const newRecs = await fetchRecommendations(accessToken, seedTracks, avgFeatures, i);

            for (const track of newRecs) {
                if (track && track.name && track.artists[0].name) {
                    const trackData = `${track.name.toLowerCase()} - ${track.artists[0].name.toLowerCase()}`;
                    if (!allTracks.has(trackData) && !recommendations.find(rec => rec.id === track.id)) {
                        recommendations.push(track);
                        if (recommendations.length >= length) break;
                    }
                }
            }

            i++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Sleep for 500ms to avoid rate limiting
        }

        // Respond with the generated playlist
        res.json(recommendations.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            image_url: track.album.images[0]?.url || ""
        })));
    } catch (error) {
        console.error("Error generating playlist:", error.message);
        res.status(500).send("Error generating playlist");
    }
};
