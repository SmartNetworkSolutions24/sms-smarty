export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).end();
  }

  const { From, To, Body } = req.body;

  // Mostrar en consola
  console.log('Mensaje recibido:');
  console.log(`De: ${From}`);
  console.log(`Para: ${To}`);
  console.log(`Mensaje: ${Body}`);

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response/>`);
}

