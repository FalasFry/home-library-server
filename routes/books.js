const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Add book
router.post('/', auth, (req, res) => {
  const { title, author, isbn } = req.body;
  db.run(
    `INSERT INTO books (title, author, isbn, owner_id) VALUES (?, ?, ?, ?)`,
    [title, author, isbn, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, author, isbn });
    }
  );
});

// Get my books
router.get('/', auth, (req, res) => {
  db.all(`SELECT * FROM books WHERE owner_id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
