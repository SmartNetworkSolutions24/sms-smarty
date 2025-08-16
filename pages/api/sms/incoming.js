// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const raw = await getRawBody(req, { encoding: 'utf8' });
    const p = new URLSearchParams(raw);

    const from = p.get('From') || '';
    const to = p.get('To') || '';
    const text = p.get('Body') || '';          // <-- EL TEXTO DEL SMS
    const messageSid = p.get('MessageSid') || '';

    const conversationKey = [from, to].sort().join('__');
    const now = Date.now();

    await db
      .collection('conversations')
      .doc(conversationKey)
      .collection('messages')
      .add({
        messageSid,
        from,
        to,
        body: text,               // <-- guarda el texto real
        direction: 'inbound',
        createdAt: new Date(now),
        createdAtMs: now,
      });

    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');         // OK solo como acuse de recibo
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

