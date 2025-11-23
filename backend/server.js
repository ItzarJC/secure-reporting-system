const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Ruta para verificar que las variables de entorno están cargadas
app.get('/api/debug-env', (req, res) => {
  res.json({
    JWT_SECRET: process.env.JWT_SECRET ? `✅ Existe (${process.env.JWT_SECRET.length} chars)` : '❌ No existe',
    STORAGE_ENCRYPTION_KEY: process.env.STORAGE_ENCRYPTION_KEY ? `✅ Existe (${process.env.STORAGE_ENCRYPTION_KEY.length} chars)` : '❌ No existe',
    SERVER_PRIVATE_KEY: process.env.SERVER_PRIVATE_KEY ? '✅ Existe' : '❌ No existe',
    PORT: process.env.PORT || 'Usando default 3001'
  });
});

// Ruta para obtener la clave pública
app.get('/api/auth/public-key', (req, res) => {
  // Formatear correctamente la clave pública para el frontend
  const publicKey = process.env.SERVER_PUBLIC_KEY ? 
    process.env.SERVER_PUBLIC_KEY.replace(/\\n/g, '\n') : 
    null;
  
  if (!publicKey) {
    return res.status(500).json({ error: 'Clave pública no configurada' });
  }
  
  res.json({ publicKey });
});

app.listen(PORT, () => {
  console.log(`🔐 Servidor seguro ejecutándose en puerto ${PORT}`);
  console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`🔐 AES_KEY: ${process.env.STORAGE_ENCRYPTION_KEY ? '✅ Configurado' : '❌ No configurado'}`);
});