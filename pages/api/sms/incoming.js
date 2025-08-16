// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Twilio envía application/x-www-form-urlencoded
    const rawText = await getRawBody(req, { encoding: 'utf8' });
    const params = new URLSearchParams(rawText);

    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const body = params.get('Body') || '';

    // Clave de conversación estable (mismo par from/to)
    const conversationKey = [from, to].sort().join('__');

    const now = new Date();
    await db
      .collection('conversations')
      .doc(conversationKey)
      .collection('messages')
      .add({
        from,
        to,
        body,
        direction: 'inbound',
        createdAt: now,
        createdAtMs: now.getTime(),
      });

    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  } catch (err) {
    console.error('incoming webhook error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}




