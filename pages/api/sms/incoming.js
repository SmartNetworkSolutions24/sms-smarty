// pages/api/sms/incoming.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import getRawBody from 'raw-body';

// ⚠️ Ajusta la ruta según tus alias/estructura.
// Si NO tienes alias "@/...", usa el import relativo:
import { db } from '../../../src/lib/firebase-admin'; // ← relativo seguro
// import { db } from '@/src/lib/firebase-admin'; // ← usa este si tienes alias configurado

import { FieldValue } from 'firebase-admin/firestore';

// Next debe NO parsear el body para leer x-www-form-urlencoded crudo
export const config = {
  api: { bodyParser: false },
};

// Helpers
const toE164 = (n: string) => n?.trim();
const makeConversationId = (a: string, b: string) =>
  [a, b].map(toE164).sort().join('__');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Twilio SIEMPRE hace POST; a todo lo demás responde 200 con TwiML vacío
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }

  try {
    // Leer cuerpo crudo y parsear como URL-encoded
    const raw = (await getRawBody(req)).toString('utf8');
    const form = new URLSearchParams(raw);

    // Campos clave de Twilio
    const from = toE164(form.get('From') || '');
    const to = toE164(form.get('To') || '');
    const body = (form.get('Body') || '').trim();

    // Si falta algo, igual respondemos 200 para evitar reintentos
    if (!from || !to) {
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      return res
        .status(200)
        .send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    }

    const conversationId = makeConversationId(from, to);
    const convRef = db.collection('conversations').doc(conversationId);
    const messagesRef = convRef.collection('messages');

    // Upsert de la conversación + inserción del mensaje
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

    // Respuesta TwiML mínima (evita error 11200)
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  } catch (e) {
    // En cualquier error, igual respondemos 200 con TwiML vacío
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
}

