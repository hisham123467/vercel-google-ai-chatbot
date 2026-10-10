export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.EMAIL_AGENT_SHARED_SECRET || '';
  const received = req.headers['x-email-agent-secret'] || '';

  if (!expected || received !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (!messages.length) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const token = process.env.VERCEL_OIDC_TOKEN || req.headers['x-vercel-oidc-token'] || '';
  if (!token) {
    return res.status(500).json({ error: 'Vercel OIDC token unavailable' });
  }

  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'stealth/glyph-cluster',
        messages: messages.slice(-20).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || '').slice(0, 18000)
        })),
        temperature: 0.35,
        max_tokens: 900,
        stream: false
      })
    });

    const raw = await response.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || 'AI Gateway request failed'
      });
    }

    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!reply) {
      return res.status(502).json({ error: 'Empty AI reply' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'AI server error: ' + error.message });
  }
}
