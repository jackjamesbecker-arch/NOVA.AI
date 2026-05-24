export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key, adminSecret } = req.body;
  if (adminSecret !== process.env.NOVA_ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  if (!key) return res.status(400).json({ error: 'Key required' });

  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const r = await fetch(`${upstashUrl}/del/nova_key_${key}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });

  if (!r.ok) return res.status(500).json({ error: 'Failed to revoke key' });
  return res.status(200).json({ success: true });
}
