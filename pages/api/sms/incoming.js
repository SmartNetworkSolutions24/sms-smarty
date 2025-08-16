// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin'; // 3 niveles hacia la raíz
import { FieldValue } from 'firebase-admin/firestore';

export const config = {
  api: { bodyParser: false }, // Twilio envía x-www-form-urlencoded crudo
};

// Helpers
const toE164 = (n) => (n || '').trim();
const makeConversationId = (a, b) => [toE164(a), toE164(b)].sort().join('__');

export default async function handler(req, res) {
  // Twilio siempre hace POST; responde 200/TwiML en otros métodos
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }

  try {
    // 1) Leer cuerpo crudo y parsearlo como URL-encoded
    const raw = (await getRawBody(req)).toString('utf8');
    const form = new URLSearchParams(raw);

    // 2) Extraer campos clave
    const from = toE164(form.get('From'));
    const to = toE164(form.get('To'));
    const body = (form.get('Body') || '').trim();

    // Si faltan campos, igual devolvemos 200 para evitar reintentos
    if (!from || !to) {
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      return res
        .status(200)
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    // 3) IDs y referencias
    const conversationId = makeConversationId(from, to);
    const convRef = db.collection('conversations').doc(conversationId);
    const messagesRef = convRef.collection('messages');

    // 4) Upsert de conversación + guardar mensaje
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(convRef);
      if (!snap.exists) {
        tx.set(convRef, {
          participants: [{ phone: from }, { phone: to }],
          lastMessage: body,
          lastDirection: 'inbound',
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.update(convRef, {
          lastMessage: body,
          lastDirection: 'inbound',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      tx.set(messagesRef.doc(), {
        body,
        from,
        to,
        direction: 'inbound',
        status: 'received',
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // 5) Responder TwiML vacío (200 OK) → evita error 11200
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (e) {
    // En error igualmente responde 200 con TwiML vacío para que Twilio no reintente
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}

