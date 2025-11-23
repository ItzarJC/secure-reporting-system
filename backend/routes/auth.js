// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Ruta para obtener la clave pública del servidor
router.get('/public-key', (req, res) => {
    try {
        const publicKey = process.env.SERVER_PUBLIC_KEY ? 
            process.env.SERVER_PUBLIC_KEY.replace(/\\n/g, '\n') : 
            null;
        
        if (!publicKey) {
            return res.status(500).json({ error: 'Clave pública no configurada' });
        }
        
        res.json({ publicKey });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo clave pública' });
    }
});

// Registro de usuario
router.post('/register', AuthController.register);

// Login de usuario
router.post('/login', AuthController.login);

// Verificar token (opcional)
router.get('/verify', AuthController.verifyToken);

module.exports = router;