// PlaylistTracksPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PlaylistTracksPage.css';

function PlaylistTracksPage() {
    const { playlistId } = useParams();  // Access playlistId from the URL
    const navigate = useNavigate();
    const [tracks, setTracks] = useState([]);
    const [playlistName, setPlaylistName] = useState("Playlist"); // State for playlist name
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                // Fetch playlist tracks and details
                const response = await axios.get(`http://localhost:8888/playlists/${playlistId}`, { withCredentials: true });
                
                // Set tracks and playlist name
                setTracks(response.data.items);
                setPlaylistName(response.data.name); // Assuming response includes playlist name
            } catch (error) {
                console.error('Error fetching playlist tracks:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTracks();
    }, [playlistId]);

    if (loading) {
        return <div>Loading tracks...</div>;
    }

    return (
        <div className="PlaylistTracksContainer">
            <h2>
                Tracks in <span className="playlist-name">{playlistName}</span>
            </h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => navigate('/playlists')}>Back to Playlists</button>
                <button onClick={() => navigate(`/generate/${playlistId}`)}>Generate Playlist</button>
            </div>
            <ul>
                {tracks.map((track) => (
                    <li key={track.track.id} className="track-item">
                        {track.track.album.images[0] && (
                            <img
                                src={track.track.album.images[0].url}
                                alt="Track cover"
                                className="track-image"
                            />
                        )}
                        <div>
                            <p className="track-text">{track.track.name} by {track.track.artists[0].name}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PlaylistTracksPage;