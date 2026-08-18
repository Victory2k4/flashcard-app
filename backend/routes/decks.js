const express = require('express');
const { query } = require('../db/setup');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/decks – list user's decks with card count
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*,
        COUNT(c.id)::int AS card_count,
        COALESCE(SUM(CASE WHEN p.status = 'mastered' THEN 1 ELSE 0 END), 0)::int AS mastered_count
      FROM decks d
      LEFT JOIN cards c ON c.deck_id = d.id
      LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = $1
      WHERE d.user_id = $1
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decks – create deck
router.post('/', async (req, res) => {
  const { title, description = '', color = '#6366f1' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const result = await query(
      'INSERT INTO decks (user_id, title, description, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, title, description, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decks/:id – get single deck with all cards
router.get('/:id', async (req, res) => {
  try {
    const deckRes = await query(
      'SELECT * FROM decks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    const deck = deckRes.rows[0];
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const cardsRes = await query(`
      SELECT c.*, p.status, p.next_review_at, p.ease_factor, p.interval, p.repetitions
      FROM cards c
      LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = $1
      WHERE c.deck_id = $2
      ORDER BY c.created_at ASC
    `, [req.userId, req.params.id]);

    res.json({ ...deck, cards: cardsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/decks/:id – update deck
router.put('/:id', async (req, res) => {
  const { title, description, color } = req.body;
  try {
    const deckRes = await query(
      'SELECT * FROM decks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    const deck = deckRes.rows[0];
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const result = await query(
      'UPDATE decks SET title = $1, description = $2, color = $3 WHERE id = $4 RETURNING *',
      [title || deck.title, description ?? deck.description, color || deck.color, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/decks/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Deck not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decks/:id/study – cards due for review today
router.get('/:id/study', async (req, res) => {
  try {
    const deckRes = await query(
      'SELECT * FROM decks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!deckRes.rows[0]) return res.status(404).json({ error: 'Deck not found' });

    const cardsRes = await query(`
      SELECT c.*, COALESCE(p.status, 'new') AS status, p.next_review_at, p.ease_factor, p.interval, p.repetitions
      FROM cards c
      LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = $1
      WHERE c.deck_id = $2
        AND (p.next_review_at IS NULL OR p.next_review_at <= NOW())
        AND COALESCE(p.status, 'new') != 'mastered'
      ORDER BY RANDOM()
      LIMIT 20
    `, [req.userId, req.params.id]);

    res.json(cardsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
