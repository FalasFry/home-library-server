require('dotenv').config();

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const openLibraryRoutes = require('./routes/openlibrary');

const app = express();
app.use(express.json());

// API routes
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/openlibrary', openLibraryRoutes);

// Serve static PWA files
// Serve static files
const publicDir = path.resolve(__dirname, 'public');
app.use(express.static(publicDir));

// Fallback for SPA/PWA routing (avoid catching API routes)
app.get(/^\/(?!auth|books|openlibrary).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const HTTP_PORT = 3000;
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
});

const HTTPS_PORT = 3443;
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
};

https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`HTTPS server running at https://<your-ip>:${HTTPS_PORT}`);
});
