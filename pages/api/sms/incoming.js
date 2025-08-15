export default function handler(req, res) {
  // Twilio SIEMPRE usa POST para webhooks de SMS
  if (req.method !== 'POST') {
    return res.status(200).end(); // 200 vacío para GET/otros
  }
  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
