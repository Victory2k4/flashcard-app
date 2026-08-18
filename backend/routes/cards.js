const express = require('express');
const { query, pool } = require('../db/setup');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/cards – add card to deck
router.post('/', async (req, res) => {
  const { deck_id, term, phonetic = '', part_of_speech = '', definition, example_sentence = '' } = req.body;
  if (!deck_id || !term || !definition) {
    return res.status(400).json({ error: 'deck_id, term, and definition are required' });
  }

  try {
    // Verify ownership
    const deckRes = await query(
      'SELECT id FROM decks WHERE id = $1 AND user_id = $2',
      [deck_id, req.userId]
    );
    if (!deckRes.rows[0]) return res.status(403).json({ error: 'Deck not found or access denied' });

    const result = await query(`
      INSERT INTO cards (deck_id, term, phonetic, part_of_speech, definition, example_sentence)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [deck_id, term, phonetic, part_of_speech, definition, example_sentence]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards/batch – add multiple cards at once
router.post('/batch', async (req, res) => {
  const { deck_id, cards } = req.body;
  if (!deck_id || !Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: 'deck_id and cards array are required' });
  }

  try {
    const deckRes = await query(
      'SELECT id FROM decks WHERE id = $1 AND user_id = $2',
      [deck_id, req.userId]
    );
    if (!deckRes.rows[0]) return res.status(403).json({ error: 'Deck not found or access denied' });

    // Use a transaction for batch insert
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const c of cards) {
        await client.query(`
          INSERT INTO cards (deck_id, term, phonetic, part_of_speech, definition, example_sentence)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [deck_id, c.term, c.phonetic || '', c.part_of_speech || '', c.definition, c.example_sentence || '']);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.status(201).json({ success: true, count: cards.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cards/:id – update card
router.put('/:id', async (req, res) => {
  const { term, phonetic, part_of_speech, definition, example_sentence } = req.body;

  try {
    // Verify ownership through deck
    const cardRes = await query(`
      SELECT c.* FROM cards c
      JOIN decks d ON d.id = c.deck_id
      WHERE c.id = $1 AND d.user_id = $2
    `, [req.params.id, req.userId]);
    const card = cardRes.rows[0];
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const result = await query(`
      UPDATE cards SET term = $1, phonetic = $2, part_of_speech = $3, definition = $4, example_sentence = $5
      WHERE id = $6
      RETURNING *
    `, [
      term || card.term,
      phonetic ?? card.phonetic,
      part_of_speech ?? card.part_of_speech,
      definition || card.definition,
      example_sentence ?? card.example_sentence,
      req.params.id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cards/:id
router.delete('/:id', async (req, res) => {
  try {
    const cardRes = await query(`
      SELECT c.id FROM cards c
      JOIN decks d ON d.id = c.deck_id
      WHERE c.id = $1 AND d.user_id = $2
    `, [req.params.id, req.userId]);
    if (!cardRes.rows[0]) return res.status(404).json({ error: 'Card not found' });

    await query('DELETE FROM cards WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
