import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system || 'You are NOVA, an APEX-class AI assistant.' },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.75,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Groq error:', err);
    return res.status(500).json({ error: err.message || 'Groq API error' });
  }
}
