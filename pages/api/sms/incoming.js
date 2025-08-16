# 1) Sobrescribe el archivo con la versión JavaScript correcta
cat > pages/api/sms/incoming.js <<'EOF'
// pages/api/sms/incoming.js
import getRawBody from 'raw-body';
import { db } from '../../../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const config = {
  api: { bodyParser: false },
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

    // 5) Responder TwiML vacío (200 OK) → evita reintentos de Twilio
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (e) {
    // En error igualmente responde 200 con TwiML vacío
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    return res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}
EOF

# 2) (Opcional pero recomendado) Ignorar artefactos
cat > .gitignore <<'EOF'
node_modules/
.next/
.env
EOF

# 3) Trae cambios remotos por si hubo otro push
git pull --rebase origin main

# 4) Commitea y sube
git add pages/api/sms/incoming.js .gitignore
git commit -m "fix(api): inbound Twilio webhook in JS + add .gitignore"
git push origin main



