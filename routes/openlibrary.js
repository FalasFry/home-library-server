const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Lookup book by ISBN
router.get('/isbn/:isbn', auth, async (req, res) => {
  const { isbn } = req.params;

  try {
    // Example: https://openlibrary.org/isbn/0451526538.json
    const url = `https://openlibrary.org/isbn/${isbn}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(404).json({ error: 'Book not found in OpenLibrary' });
    }

    const data = await response.json();

    // Extract useful info
    const title = data.title || null;
    const publish_date = data.publish_date || null;
    const number_of_pages = data.number_of_pages || null;
    const publishers = data.publishers ? data.publishers.join(', ') : null;

    // OpenLibrary stores authors separately, need another fetch
    let authors = [];
    if (data.authors && data.authors.length > 0) {
      for (const authorRef of data.authors) {
        const authorResp = await fetch(`https://openlibrary.org${authorRef.key}.json`);
        if (authorResp.ok) {
          const authorData = await authorResp.json();
          authors.push(authorData.name);
        }
      }
    }

    res.json({
      isbn,
      title,
      authors,
      publish_date,
      number_of_pages,
      publishers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

module.exports = router;