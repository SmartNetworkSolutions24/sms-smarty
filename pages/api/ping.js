// pages/api/sms/incoming.js
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();  // no POST => no TwiML
  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response/>');
}
