export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key, email } = req.body;
  if (!key || !email) return res.status(400).json({ error: 'Missing key or email' });

  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const r = await fetch(`${upstashUrl}/get/nova_key_${key}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });
  const data = await r.json();
  if (!data.result) return res.status(404).json({ error: 'Invalid key' });

  const clearance = JSON.parse(decodeURIComponent(data.result));

  // check email match
  if (clearance.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(401).json({ error: 'Email does not match key' });
  }

  // check expiry
  if (clearance.expiresAt && new Date() > new Date(clearance.expiresAt)) {
    return res.status(403).json({ error: 'Trial key expired', expired: true });
  }

  // update last login + login count
  clearance.lastLogin = new Date().toISOString();
  clearance.loginCount = (clearance.loginCount || 0) + 1;

  await fetch(`${upstashUrl}/set/nova_key_${key}/${encodeURIComponent(JSON.stringify(clearance))}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });

  return res.status(200).json({ clearance });
}
