const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
const corsOptions = {
  origin: '*', // Permitir todos para evitar bloqueos en el hosting compartido
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/room-types', require('./routes/roomType.routes'));
app.use('/api/reviews', require('./routes/review.routes'));

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejador de errores global (500)
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ 
    msg: 'Algo salió mal en el servidor',
    error: process.env.NODE_ENV === 'production' ? null : err.message 
  });
});

app.get('/', (req, res) => {
  res.send('API de HoteIA funcionando');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
