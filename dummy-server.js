// dummy-server.js
const express = require('express');
const app = express();

// Para poder leer JSON en el body
app.use(express.json());

// Endpoint que simula el servidor de pagos
app.post('/payments', (req, res) => {
  console.log('¡Solicitud SSRF recibida!', req.body);
  res.send('Recibido');
});

// Escuchar en el puerto 3001
app.listen(3001, '0.0.0.0', () => console.log('Dummy server escuchando en puerto 3001'));
