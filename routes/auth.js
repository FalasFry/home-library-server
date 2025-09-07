const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("library.db");

// make sure users table exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

exports.register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const hashed = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed], function(err) {
    if (err) {
      return res.status(400).json({ error: "User already exists" });
    }
    res.json({ success: true });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = { id: user.id, username: user.username };
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
};

exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
};
