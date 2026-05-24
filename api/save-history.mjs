export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key, history } = req.body;
  if (!key || !history) return res.status(400).json({ error: 'Missing key or history' });

  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // keep last 40 messages to stay within limits
  const trimmed = history.slice(-40);

  const r = await fetch(`${upstashUrl}/set/nova_history_${key}/${encodeURIComponent(JSON.stringify(trimmed))}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });

  if (!r.ok) return res.status(500).json({ error: 'Failed to save history' });
  return res.status(200).json({ success: true });
}
