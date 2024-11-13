// PlaylistTracksPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPlaylistTracks, fetchAccessToken } from '../api';
import Track from '../models/Track';
import './PlaylistTracksPage.css';

function PlaylistTracksPage() {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const [tracks, setTracks] = useState([]);
    const [playlistName, setPlaylistName] = useState("Playlist");
    const [loading, setLoading] = useState(true);
    const [accessTokenObject, setTokenObject] = useState(null);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const tokenResponse = await fetchAccessToken();
                setTokenObject(tokenResponse);

                const response = await fetchPlaylistTracks(playlistId);
                const tracksData = response.items.map((item) => {
                    try {
                        return new Track(
                            item.track.id,
                            item.track.name,
                            item.track.artists[0]?.name || 'Unknown Artist', // Handle missing artist
                            item.track.album.images[0]?.url || '' // Handle missing album image
                        );
                    } catch (error) {
                        console.error("Error creating track instance:", error);
                        return null; // Return null if track instantiation fails
                    }
                }).filter(track => track !== null);

                setTracks(tracksData);
                setPlaylistName(response.name);
            } catch (error) {
                console.error('Error fetching playlist tracks:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTracks();
    }, [playlistId]);

    const handlePlayTrack = async (index) => {
        if (accessTokenObject) {
            await tracks[index].playTrack(accessTokenObject);
            tracks[index].onEnd(() => playNextTrack(index), accessTokenObject);
            setTracks([...tracks]);
        } else {
            console.error("Access token is missing.");
        }
    };

    const playNextTrack = (index) => {
        const nextIndex = (index + 1) % tracks.length;
        handlePlayTrack(nextIndex);
    };

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
                {tracks.map((track, index) => (
                    <li key={track.id} className="track-item" onClick={() => handlePlayTrack(index)}>
                        <div className="track-image-container">
                            {track.imageUrl && (
                                <img
                                    src={track.imageUrl}
                                    alt={`${track.name} cover`}
                                    className="track-image"
                                />
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
        </div>
    );
}

export default PlaylistTracksPage;
