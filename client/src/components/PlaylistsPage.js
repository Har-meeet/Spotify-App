import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {fetchPlaylists} from '../api';
import './PlaylistsPage.css';

import Playlist from '../models/Playlist';

function PlaylistsPage() {
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
        const getPlaylists = async () => {
            try {
                const response = await fetchPlaylists();

                const playlistsData = response.items.map(
                    (playlist) => new Playlist(
                        playlist.id,
                        playlist.name,
                        playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null
                    )
                );
                setPlaylists(playlistsData);
            } catch (error) {
                console.error('Error fetching playlists:', error);
            }
        };
        getPlaylists();
    }, []);

    return (
        <div className="PlaylistsContainer">
            <h1>Your Playlists</h1>
            <ul>
                {playlists.map((playlist) => (
                    <li key={playlist.id} className="playlist-item">
                        {playlist.imageUrl ? (
                            <img src={playlist.imageUrl} alt="Playlist cover" className="playlist-image" />
                        ) : (
                            <div className="playlist-image-placeholder">No Image</div>
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