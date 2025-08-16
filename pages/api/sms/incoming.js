// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin';

export const config = {
  api: { bodyParser: false }, // Twilio envía x-www-form-urlencoded (sin JSON)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1) Leer el cuerpo crudo (x-www-form-urlencoded) y parsearlo
    const rawText = await getRawBody(req, { encoding: 'utf8' });
    const params = new URLSearchParams(rawText);

    const from = params.get('From') || '';
    const to = params.get('To') || '';
    const body = params.get('Body') || '';

    // 2) Clave de conversación estable: mismo par de números => mismo doc
    const conversationKey = [from, to].sort().join('__');

    // 3) Guardar el mensaje entrante en Firestore
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
        createdAt: now,            // Timestamp legible
        createdAtMs: now.getTime(),// Para ordenar rápido en el cliente
        twilio: {
          messageSid: params.get('MessageSid') || params.get('SmsSid') || null,
          messagingServiceSid: params.get('MessagingServiceSid') || null,
          smsStatus: params.get('SmsStatus') || null,
          numSegments: params.get('NumSegments')
            ? Number(params.get('NumSegments'))
            : null,
          apiVersion: params.get('ApiVersion') || null,
        },
      });

    // 4) No responder nada (sin auto-replies). 204 = éxito sin cuerpo
    return res.status(204).end();
  } catch (err) {
    console.error('Inbound SMS webhook error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}



