// pages/api/sms/incoming.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    // Twilio llama por POST; para GET u otros, responde 200 vacío.
    return res.status(200).end();
  }
  res.setHeader('Content-Type', 'application/xml'); // o 'text/xml'
  // ¡OJO! que el primer carácter del body sea '<' (sin espacios/BOM antes)
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response/>');
}
