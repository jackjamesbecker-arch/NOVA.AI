export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const results = { timestamp: new Date().toISOString() };

  // check Groq
  const groqStart = Date.now();
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });
    results.groq = { status: groqRes.ok ? 'online' : 'degraded', latency: Date.now() - groqStart };
  } catch {
    results.groq = { status: 'offline', latency: null };
  }

  // check Upstash
  const dbStart = Date.now();
  try {
    const dbRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    });
    results.database = { status: dbRes.ok ? 'online' : 'degraded', latency: Date.now() - dbStart };
  } catch {
    results.database = { status: 'offline', latency: null };
  }

  // overall status
  const statuses = [results.groq.status, results.database.status];
  results.overall = statuses.every(s => s === 'online') ? 'online'
    : statuses.some(s => s === 'offline') ? 'offline' : 'degraded';

  return res.status(200).json(results);
}
