import React, { useState, useEffect } from 'react';
import { savePlaylist, fetchPlaylists } from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import './NamePlaylistPage.css';

function NamePlaylistPage() {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [trackIds, setTrackIds] = useState([]); // Track IDs generated for the playlist
    const [error, setError] = useState(null);
    const [existingPlaylistNames, setExistingPlaylistNames] = useState([]);

    useEffect(() => {
        // Retrieve the generated tracks from local storage
        const savedTracks = JSON.parse(localStorage.getItem('generatedTracks')) || [];
        setTrackIds(savedTracks.map(track => track.id));

        // Fetch user's existing playlists to check for duplicate names
        const loadPlaylists = async () => {
            try {
                const playlists = await fetchPlaylists();
                const playlistNames = playlists.items.map((playlist) => playlist.name.toLowerCase());
                console.log("Existing playlist names:", playlistNames);
                setExistingPlaylistNames(playlistNames);
            } catch (error) {
                console.error("Failed to fetch playlists:", error);
            }
        };

        loadPlaylists();
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();

        // Check for duplicate playlist name
        if (existingPlaylistNames.includes(name.toLowerCase())) {
            setError("You already have a playlist with this name.");
            return;
        }

        // Clear any previous errors and save the playlist
        setError(null);
        try {
            await savePlaylist(playlistId, name, trackIds);
            localStorage.removeItem('generatedTracks'); // Clear stored tracks after saving
            navigate('/playlists');
        } catch (error) {
            console.error("Failed to save playlist:", error);
        }
    };

    const handleFocus = () => {
        setError(null); // Clear error on input focus
    };

    return (
        <div className="name-playlist-container">
            <form onSubmit={handleSave} className="name-playlist-form">
                <label>Playlist Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={handleFocus}
                    required
                    placeholder="Enter playlist name"
                />
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Save Playlist</button>
            </form>
        </div>
    );
}

export default NamePlaylistPage;
