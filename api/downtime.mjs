export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  const { action, adminSecret } = body;
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // ── DOWNTIME ──
  if (action === 'get') {
    const r = await fetch(`${upstashUrl}/get/nova_downtime`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const data = await r.json();
    const downtime = data.result ? JSON.parse(decodeURIComponent(data.result)) : { active: false, message: '' };
    return res.status(200).json(downtime);
  }

  if (action === 'set') {
    if (adminSecret !== process.env.NOVA_ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const { message, active } = body;
    const value = encodeURIComponent(JSON.stringify({ active: !!active, message: message || '', updatedAt: new Date().toISOString() }));
    await fetch(`${upstashUrl}/set/nova_downtime/${value}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    return res.status(200).json({ ok: true, active: !!active, message });
  }

  // ── OPERATOR MESSAGES ──
  if (action === 'msg-send') {
    const { fromEmail, fromName, toEmail, message } = body;
    if (!fromEmail || !toEmail || !message) return res.status(400).json({ error: 'Missing fields' });
    const redisKey = `nova_operator_msg_${toEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const existing = await fetch(`${upstashUrl}/get/${redisKey}`, { headers: { Authorization: `Bearer ${upstashToken}` } });
    const existingData = await existing.json();
    const messages = existingData.result ? JSON.parse(decodeURIComponent(existingData.result)) : [];
    messages.push({ from: fromName || fromEmail, fromEmail, message, sentAt: new Date().toISOString(), read: false });
    const payload = encodeURIComponent(JSON.stringify(messages));
    await fetch(`${upstashUrl}/set/${redisKey}/${payload}`, { headers: { Authorization: `Bearer ${upstashToken}` } });
    return res.status(200).json({ ok: true });
  }

  if (action === 'msg-check') {
    const { toEmail } = body;
    if (!toEmail) return res.status(400).json({ error: 'Missing email' });
    const redisKey = `nova_operator_msg_${toEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const r = await fetch(`${upstashUrl}/get/${redisKey}`, { headers: { Authorization: `Bearer ${upstashToken}` } });
    const data = await r.json();
    const messages = data.result ? JSON.parse(decodeURIComponent(data.result)) : [];
    const unread = messages.filter(m => !m.read);
    if (unread.length > 0) {
      const updated = messages.map(m => ({ ...m, read: true }));
      const payload = encodeURIComponent(JSON.stringify(updated));
      await fetch(`${upstashUrl}/set/${redisKey}/${payload}`, { headers: { Authorization: `Bearer ${upstashToken}` } });
    }
    return res.status(200).json({ messages: unread });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
