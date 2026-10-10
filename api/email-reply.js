import chatHandler from './chat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.EMAIL_AGENT_SHARED_SECRET || '';
  const received = req.headers['x-email-agent-secret'] || '';

  if (!expected || received !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return chatHandler(req, res);
}
