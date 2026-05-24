import Ably from 'ably';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' });

  try {
    const client = new Ably.Rest(process.env.ABLY_API_KEY);
    const tokenRequest = await client.auth.createTokenRequest({
      clientId,
      capability: { '*': ['publish', 'subscribe', 'presence'] },
      ttl: 3600000, // 1 hour
    });
    return res.status(200).json(tokenRequest);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
