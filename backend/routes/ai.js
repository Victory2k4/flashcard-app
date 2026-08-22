const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authMiddleware } = require('../middleware/auth');
const { query } = require('../db/setup');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/generate-deck
// Body: { topic, language, count }
// Tự động tạo bộ thẻ từ vựng từ 1 chủ đề bằng Gemini AI
router.post('/generate-deck', authMiddleware, async (req, res) => {
  const { topic, language = 'English', count = 15 } = req.body;

  if (!topic) return res.status(400).json({ error: 'Vui lòng nhập chủ đề' });
  if (count > 30) return res.status(400).json({ error: 'Tối đa 30 thẻ mỗi lần' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a language learning assistant. Generate ${count} flashcard words for the topic "${topic}" in ${language}.

Return ONLY a valid JSON array (no markdown, no explanation) like this:
[
  {
    "term": "word in target language",
    "phonetic": "/pronunciation/",
    "part_of_speech": "noun/verb/adjective/etc",
    "definition": "clear Vietnamese definition",
    "example_sentence": "example sentence using this word"
  }
]

Rules:
- Definitions must be in Vietnamese
- Words must be relevant to the topic "${topic}"
- Include common, practical vocabulary
- phonetic uses IPA notation
`.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON từ response của Gemini
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Gemini không trả về JSON hợp lệ');

    const cards = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error('Dữ liệu không hợp lệ');
    }

    // Tạo deck trong database
    const deckResult = await query(
      `INSERT INTO decks (user_id, title, description, color) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        req.userId,
        `${topic} (AI Generated)`,
        `Bộ thẻ được tạo tự động bởi AI cho chủ đề: ${topic}`,
        '#8b5cf6',
      ]
    );
    const deck = deckResult.rows[0];

    // Thêm tất cả cards vào database
    const insertedCards = [];
    for (const card of cards) {
      const cardResult = await query(
        `INSERT INTO cards (deck_id, term, phonetic, part_of_speech, definition, example_sentence)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          deck.id,
          card.term || '',
          card.phonetic || '',
          card.part_of_speech || '',
          card.definition || '',
          card.example_sentence || '',
        ]
      );
      insertedCards.push(cardResult.rows[0]);
    }

    res.status(201).json({
      deck,
      cards: insertedCards,
      message: `Đã tạo ${insertedCards.length} thẻ cho chủ đề "${topic}"`,
    });
  } catch (err) {
    console.error('AI generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suggest-card
// Gợi ý định nghĩa + phiên âm cho 1 từ cụ thể
router.post('/suggest-card', authMiddleware, async (req, res) => {
  const { term, language = 'English' } = req.body;
  if (!term) return res.status(400).json({ error: 'Vui lòng nhập từ cần tra' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Give information for the ${language} word/phrase: "${term}"

Return ONLY a valid JSON object (no markdown):
{
  "term": "${term}",
  "phonetic": "/IPA pronunciation/",
  "part_of_speech": "noun/verb/adjective/etc",
  "definition": "Vietnamese definition",
  "example_sentence": "example sentence in ${language}"
}
`.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Không thể xử lý phản hồi từ AI');

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('AI suggest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
