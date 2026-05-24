export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { adminSecret } = req.body;
  if (adminSecret !== process.env.NOVA_ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // list all nova_key_* keys
  const scanRes = await fetch(`${upstashUrl}/keys/nova_key_*`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });
  const scanData = await scanRes.json();
  const keys = scanData.result || [];

  // fetch all values in parallel
  const operators = await Promise.all(keys.map(async k => {
    const r = await fetch(`${upstashUrl}/get/${k}`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    const d = await r.json();
    if (!d.result) return null;
    try {
      const data = JSON.parse(decodeURIComponent(d.result));
      return { key: k.replace('nova_key_', ''), ...data };
    } catch { return null; }
  }));

  return res.status(200).json({ operators: operators.filter(Boolean) });
}
