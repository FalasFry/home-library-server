const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

// Register new user
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const password_hash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, password_hash) VALUES (?, ?)`,
    [username, password_hash],
    function (err) {
      if (err) return res.status(400).json({ error: 'Username already exists' });
      res.json({ id: this.lastID, username });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token });
  });
});

module.exports = router;
