import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import PlaylistsPage from './components/PlaylistsPage';
import PlaylistTracksPage from './components/PlaylistTracksPage';
import GeneratePlaylistPage from './components/GeneratePlaylistPage';
import NamePlaylistPage from './components/NamePlaylistPage';
import axios from 'axios';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('http://localhost:8888/auth/check-session', { withCredentials: true });
                setIsAuthenticated(response.data.isAuthenticated);
                console.log('Authentication status:', response.data.isAuthenticated);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []); // Only run once on component mount

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <Routes>
            <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/playlist" /> : <LoginPage />} 
            />
            <Route 
                path="/playlist" 
                element={isAuthenticated ? <PlaylistsPage /> : <Navigate to="/" />} 
            />
            <Route 
                path="/playlist/:playlistId" 
                element={isAuthenticated ? <PlaylistTracksPage /> : <Navigate to="/" />}
            />
            <Route 
                path="/generate/:playlistId" 
                element={isAuthenticated ? <GeneratePlaylistPage /> : <Navigate to="/" />}
            />
            <Route 
                path="/name_playlist/:playlistId" 
                element={isAuthenticated ? <NamePlaylistPage /> : <Navigate to="/" />}
            />
            <Route 
                path="*" 
                element={<Navigate to="/" />} 
            />
        </Routes>
    );
}

export default App;