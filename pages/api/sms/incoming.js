// pages/api/sms/incoming.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    // Para GET u otros, 200 vacío para no generar alertas.
    return res.status(200).end();
  }

  // Twilio quiere XML (TwiML)
  res.setHeader('Content-Type', 'application/xml');
  // Respuesta mínima válida para eliminar el 12200
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response/>');
}
