export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const r = await fetch(`${upstashUrl}/get/nova_history_${key}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });

  const data = await r.json();
  if (!data.result) return res.status(200).json({ history: [], drift: 0 });

  try {
    const parsed = JSON.parse(decodeURIComponent(data.result));
    // support both old format (array) and new format (object)
    if (Array.isArray(parsed)) return res.status(200).json({ history: parsed, drift: 0 });
    return res.status(200).json({ history: parsed.history || [], drift: parsed.drift || 0 });
  } catch {
    return res.status(200).json({ history: [], drift: 0 });
  }
}
