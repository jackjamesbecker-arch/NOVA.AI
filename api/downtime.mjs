export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, adminSecret, message, active } = req.body;
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // get downtime status — public, no auth needed
  if (action === 'get') {
    const r = await fetch(`${upstashUrl}/get/nova_downtime`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const data = await r.json();
    const downtime = data.result ? JSON.parse(decodeURIComponent(data.result)) : { active: false, message: '' };
    return res.status(200).json(downtime);
  }

  // set downtime — requires admin secret
  if (action === 'set') {
    if (adminSecret !== process.env.NOVA_ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const value = encodeURIComponent(JSON.stringify({ active: !!active, message: message || '', updatedAt: new Date().toISOString() }));
    await fetch(`${upstashUrl}/set/nova_downtime/${value}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    return res.status(200).json({ ok: true, active: !!active, message });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
