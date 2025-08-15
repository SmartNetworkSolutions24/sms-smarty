export default function handler(req, res) {
  // Twilio publicará por POST; si quieres aceptar GET para healthcheck, puedes
  if (req.method !== 'POST') {
    return res.status(200).end(); // healthcheck ok, cuerpo vacío
  }
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<Response/>'); // TwiML válido -> Twilio feliz, sin 12200
}
