// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const config = {
  api: { bodyParser: false },
};

const toE164 = (n) => (n || '').trim();
const makeConversationId = (a, b) => [toE164(a), toE164(b)].sort().join('__');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }

  try {
    const raw = (await getRawBody(req)).toString('utf8');
    const form = new URLSearchParams(raw);

    const from = toE164(form.get('From'));
    const to = toE164(form.get('To'));
    const body = (form.get('Body') || '').trim();

    if (!from || !to) {
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      return res
        .status(200)
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    const conversationId = makeConversationId(from, to);
    const convRef = db.collection('conversations').doc(conversationId);
    const messagesRef = convRef.collection('messages');

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

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (e) {
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}


