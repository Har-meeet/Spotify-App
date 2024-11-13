// GeneratePlaylistPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generatePlaylist, fetchAccessToken } from '../api';
import Track from '../models/Track';
import './GeneratePlaylistPage.css';

function GeneratePlaylistPage() {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const [length, setLength] = useState(50);
    const [error, setError] = useState(null);
    const [generatedTracks, setGeneratedTracks] = useState([]);
    const [isGenerated, setIsGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [accessTokenObject, setTokenObject] = useState(null);

    const handleGenerate = async (event) => {
        event.preventDefault();

        if (length < 25 || length > 100) {
            setError("Playlist length must be between 25 and 100.");
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const tokenResponse = await fetchAccessToken();
            setTokenObject(tokenResponse);

            const playlist = await generatePlaylist(playlistId, length);
            const tracksData = playlist.map(
                (track) => new Track(
                    track.id,
                    track.name,
                    track.artist,
                    track.image_url
                )
            );

            setGeneratedTracks(tracksData);
            setIsGenerated(true);
            localStorage.setItem('generatedTracks', JSON.stringify(tracksData));
        } catch (err) {
            console.error("Failed to generate playlist:", err);
            setError("Failed to generate playlist. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePlayTrack = async (track) => {
        if (accessTokenObject) {
            await track.playTrack(accessTokenObject);
            setGeneratedTracks([...generatedTracks]); // Trigger re-render to reflect play/pause state
        } else {
            console.error("Access token is missing.");
        }
    };

    const handleSave = () => {
        navigate(`/name_playlist/${playlistId}`);
    };

    const handleReject = () => {
        setGeneratedTracks([]);
        setIsGenerated(false);
        navigate(`/playlists`);
    };

    return (
        <div className="generate-playlist-container">
            {!loading && !isGenerated && (
                <form onSubmit={handleGenerate}>
                    <label>Playlist Length (25 to 100):</label>
                    <input 
                        type="number" 
                        value={length} 
                        onChange={(e) => setLength(e.target.value)} 
                        min="25" 
                        max="100" 
                        required 
                    />
                    {error && <p className="error-message">{error}</p>}
                    <div className="button-container">
                        <button type="button" onClick={() => navigate(`/playlist/${playlistId}`)}>Back to Playlist</button>
                        <button type="submit">Generate Playlist</button>
                    </div>
                </form>
            )}
            {loading && (
                <div className="loading-indicator">
                    <p>Generating playlist, please wait... This process may take up to a minute.</p>
                    <div className="spinner"></div>
                </div>
            )}
            {!loading && isGenerated && (
                <div className="generated-playlist">
                    <h2>Generated Playlist</h2>
                    <ul>
                        {generatedTracks.map((track) => (
                            <li key={track.id} className="track-item" onClick={() => handlePlayTrack(track)}>
                                <div className="track-image-container">
                                    {track.imageUrl ? (
                                        <img
                                            src={track.imageUrl}
                                            alt={`${track.name} cover`}
                                            className="track-image"
                                        />
                                    ) : (
                                        <div className="track-image-placeholder">No Image</div>
                                    )}
                                    <div className="play-button-overlay">
                                        {track.isPlaying ? '⏸' : '▶️'}
                                    </div>
                                </div>
                                <div className="track-details">
                                    <p className="track-text">{track.name} by {track.artist}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="button-container">
                        <button onClick={handleSave}>Save Playlist</button>
                        <button onClick={handleReject}>Reject Playlist</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeneratePlaylistPage;