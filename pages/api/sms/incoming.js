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
    // Twilio manda application/x-www-form-urlencoded
    const raw = await getRawBody(req, { encoding: 'utf8' });
    const p = new URLSearchParams(raw);

    const from = p.get('From') || '';
    const to = p.get('To') || '';
    const text = p.get('Body') || '';            // <- AQUÍ viene el SMS real
    const messageSid = p.get('MessageSid') || '';

    const conversationKey = [from, to].sort().join('__');
    const now = new Date();

    await db
      .collection('conversations')
      .doc(conversationKey)
      .collection('messages')
      .add({
        messageSid,
        from,
        to,
        body: text,                               // <- guardar el texto real
        direction: 'inbound',
        createdAt: now,
        createdAtMs: now.getTime(),
      });

    // Respuesta para Twilio (solo acuse de recibo)
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('OK');
  } catch (err) {
    console.error('incoming webhook error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}



