const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'https://mcq-generator-8825e.web.app',
  'http://localhost:4200'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

app.post('/generate-mcq', async (req, res) => {
  const { passage, numQuestions, difficulty } = req.body;

  if (!passage || !numQuestions || !Array.isArray(difficulty)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const questionsPerDifficulty = Math.ceil(numQuestions / difficulty.length);
  let finalMCQs = '';

  for (const level of difficulty) {
    const prompt = `
Generate ${questionsPerDifficulty} multiple choice questions from the following passage with **${level}** difficulty.
Each question should be formatted like:

**${level.charAt(0).toUpperCase() + level.slice(1)}**
1. Question
A) Option A
B) Option B
C) Option C
D) Option D
Answer: <Correct Option>

Passage:
${passage}
`;

    try {
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const answer = groqResponse.data.choices?.[0]?.message?.content || '';
      finalMCQs += `\n${answer.trim()}\n`;

    } catch (err) {
      console.error('GROQ API Error:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to generate MCQs for ' + level });
    }
  }

  res.json({ mcqs: finalMCQs.trim() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));