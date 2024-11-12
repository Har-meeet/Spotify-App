import axios from 'axios';

const API_BASE = 'http://localhost:8888';

export const fetchPlaylists = async () => {
    const response = await axios.get(`${API_BASE}/playlists`, { withCredentials: true });
    return response.data;
};

export const fetchPlaylistTracks = async (playlistId) => {
    const response = await axios.get(`${API_BASE}/playlists/${playlistId}`, { withCredentials: true });
    return response.data;
};

export const generatePlaylist = async (playlistId, length) => {
    const response = await axios.post(`${API_BASE}/generate/${playlistId}`, { length }, { withCredentials: true });
    return response.data;
};

export const savePlaylist = async (playlistId, name, trackIds) => {
    const response = await axios.post(`${API_BASE}/save_playlist`, { playlistId, name, trackIds }, { withCredentials: true });
    return response.data;
};