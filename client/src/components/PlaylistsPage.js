import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './PlaylistsPage.css';

function PlaylistsPage() {
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const response = await axios.get('http://localhost:8888/playlists', { withCredentials: true });
                setPlaylists(response.data.items);
            } catch (error) {
                console.error('Error fetching playlists:', error);
            }
        };
        fetchPlaylists();
    }, []);

    return (
        <div className="PlaylistsContainer">
            <h1>Your Playlists</h1>
            <ul>
                {playlists.map((playlist) => (
                    <li key={playlist.id} className="playlist-item">
                        {playlist.images[0] && (
                            <img src={playlist.images[0].url} alt="Playlist cover" className="playlist-image" />
                        )}
                        <Link to={`/playlist/${playlist.id}`} className="playlist-link">
                            {playlist.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PlaylistsPage;