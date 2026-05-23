export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tier, email, adminSecret } = req.body;

  if (adminSecret !== process.env.NOVA_ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tiers = ['RECRUIT', 'AGENT', 'COMMANDER'];
  if (!tiers.includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

  const prefixMap = { RECRUIT: 'RECRUIT', AGENT: 'AGENT', COMMANDER: 'CMD' };
  const prefix = prefixMap[tier];
  const num = String(Math.floor(1000 + Math.random() * 9000));
  const key = `${prefix}-${num}`;

  const modeMap = {
    RECRUIT:   ['STANDARD', 'TACTICAL'],
    AGENT:     ['STANDARD', 'TACTICAL', 'ANALYSIS', 'CODE', 'RESEARCH', 'CREATIVE'],
    COMMANDER: ['STANDARD', 'TACTICAL', 'ANALYSIS', 'CODE', 'RESEARCH', 'CREATIVE'],
  };
  const archiveMap = { RECRUIT: 5, AGENT: 999, COMMANDER: 999 };

  const value = JSON.stringify({
    tier,
    level: tiers.indexOf(tier) + 1,
    modes: modeMap[tier],
    archiveLimit: archiveMap[tier],
    email: email || '',
    createdAt: new Date().toISOString(),
  });

  // Store in Upstash
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const r = await fetch(`${upstashUrl}/set/nova_key_${key}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${upstashToken}` },
  });

  if (!r.ok) return res.status(500).json({ error: 'Failed to store key' });

  return res.status(200).json({ key });
}
