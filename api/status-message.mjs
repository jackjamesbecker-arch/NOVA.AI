export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, adminSecret, message, level } = req.body;
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // get — public
  if (action === 'get') {
    const r = await fetch(`${upstashUrl}/get/nova_status_message`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const data = await r.json();
    const result = data.result ? JSON.parse(decodeURIComponent(data.result)) : { message: '', level: 'info', updatedAt: '' };
    return res.status(200).json(result);
  }

  // set — admin only
  if (action === 'set') {
    if (adminSecret !== process.env.NOVA_ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = encodeURIComponent(JSON.stringify({
      message: message || '',
      level: level || 'info',
      updatedAt: new Date().toISOString()
    }));
    await fetch(`${upstashUrl}/set/nova_status_message/${payload}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    return res.status(200).json({ ok: true });
  }

  // clear — admin only
  if (action === 'clear') {
    if (adminSecret !== process.env.NOVA_ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await fetch(`${upstashUrl}/del/nova_status_message`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
