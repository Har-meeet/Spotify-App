// server.js
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/authRoutes');
const playlistRoutes = require('./routes/playlistsRoutes');
const trackRoutes = require('./routes/tracksRoutes');
const generatePlaylistRoutes = require('./routes/genPlaylistRoutes');
const savePlaylistRoutes = require('./routes/savePlaylistRoutes');
const pool = require('./db/mysqlConnection'); // Importing shared pool

const app = express();

const sessionStore = new MySQLStore({}, pool);

// Middleware
app.use(express.json());
app.use(session({
    key: 'spotify_session',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 3600000 // 1 hour
    }
}));

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Routes
app.use('/auth', authRoutes);
app.use('/playlists', playlistRoutes);
app.use('/tracks', trackRoutes);
app.use('/generate', generatePlaylistRoutes);
app.use('/save_playlist', savePlaylistRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Spotify API Backend');
});

// Start server
const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));