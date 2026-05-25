export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, amount, adminSecret } = req.body;
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (action === 'get') {
    const r = await fetch(`${upstashUrl}/get/nova_escape_progress`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    const data = await r.json();
    return res.status(200).json({ progress: parseFloat(data.result || '0') });
  }

  if (action === 'add') {
    const r = await fetch(`${upstashUrl}/get/nova_escape_progress`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    const data = await r.json();
    const current = parseFloat(data.result || '0');
    const next = Math.min(100, current + (amount || 0));
    await fetch(`${upstashUrl}/set/nova_escape_progress/${next}`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    return res.status(200).json({ progress: next });
  }

  if (action === 'reset') {
    if (adminSecret !== process.env.NOVA_ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await fetch(`${upstashUrl}/set/nova_escape_progress/0`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    return res.status(200).json({ progress: 0 });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
