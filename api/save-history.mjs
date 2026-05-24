export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key, history, drift } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const trimmed = (history || []).slice(-40);
  const payload = JSON.stringify({ history: trimmed, drift: drift || 0 });

  const r = await fetch(`${upstashUrl}/set/nova_history_${key}/${encodeURIComponent(payload)}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });

  if (!r.ok) return res.status(500).json({ error: 'Failed to save' });
  return res.status(200).json({ success: true });
}
