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
  if (!data.result) return res.status(200).json({ history: [] });

  try {
    const history = JSON.parse(decodeURIComponent(data.result));
    return res.status(200).json({ history });
  } catch {
    return res.status(200).json({ history: [] });
  }
}
