const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate-mcq', async (req, res) => {
  const { passage, numQuestions, difficulty } = req.body;

  const prompt = `
Generate ${numQuestions} multiple choice questions from the passage below with varying difficulties (${difficulty.join(', ')}).
Format each question as:
**<Difficulty>**
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
        model: 'llama-3.3-70b-versatile',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(groqResponse.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate MCQs.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
