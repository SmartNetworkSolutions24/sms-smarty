// pages/api/sms/incoming.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    // Twilio siempre llama con POST; para GET u otros, responde 200 vacío.
    return res.status(200).end();
  }

  // Twilio espera TwiML (XML) con el Content-Type correcto
  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');

  // Respuesta mínima válida (evita el 12200 "Content is not allowed in prolog")
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
