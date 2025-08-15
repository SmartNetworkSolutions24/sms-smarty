export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end(); // healthcheck
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<Response/>'); // TwiML válido
}
