// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Twilio envía application/x-www-form-urlencoded
    const rawText = await getRawBody(req, { encoding: 'utf8' });
    const params = new URLSearchParams(rawText);

    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const body = params.get('Body') || '';

    // clave estable para la conversación (par from/to)
    const conversationKey = [from, to].sort().join('__');

    const now = new Date();
    await db.collection('conversations')
      .doc(conversationKey)
      .collection('messages')
      .add({
        direction: 'inbound',
        from,
        to,
        body,
        createdAt: now,
        createdAtMs: now.getTime(),
      });

    // Responder TwiML vacío evita 12200 y NO envía auto-respuesta
    res.status(200).setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (err) {
    console.error('inbound webhook error:', err);
    // Aun en error, devuelve TwiML vacío para que Twilio no reintente
    res.status(200).setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
}

