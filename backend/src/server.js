const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// Enrutadores principales
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
const path = require('path');

// Servir archivos estáticos del frontend desde la raíz del monorepo
app.use(express.static(path.resolve(__dirname, '..', 'frontend', 'dist')));

// Redirigir cualquier otra ruta al index.html del frontend (IMPORTANTE: dejar después de tus rutas /api)
// COLOCA ESTO
app.get('/:*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html'));
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
