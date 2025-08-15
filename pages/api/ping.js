// pages/api/sms/incoming.js
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<Response/>');
}
