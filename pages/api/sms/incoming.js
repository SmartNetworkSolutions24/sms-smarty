export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).end(); // Twilio usa POST; para GET devolvemos vacío
  }
  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  // ¡Importante! que el primer byte sea '<' (nada antes)
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
