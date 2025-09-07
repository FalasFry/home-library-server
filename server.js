require('dotenv').config();

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const session = require("express-session");
const auth = require("./auth");

// Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const openLibraryRoutes = require('./routes/openlibrary');

const app = express();
app.use(express.json());
app.use(session({
  secret: "supersecret", 
  resave: false, 
  saveUninitialized: false
}));

// --- AUTH ROUTES ---
app.post("/api/register", auth.register);
app.post("/api/login", auth.login);
app.post("/api/logout", auth.logout);

// --- PROTECTED ROUTES ---
app.get("/api/books", auth.requireLogin, (req, res) => {
  // return books for req.session.user
});

app.post("/api/books", auth.requireLogin, (req, res) => {
  // save book for req.session.user
});

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
