// backend/controllers/authController.js
const db = require('../config/database');
const CryptoUtils = require('../utils/cryptoUtils');
const jwt = require('jsonwebtoken');

class AuthController {
    // Registro de usuario
    static async register(req, res) {
        try {
            const { username, password, email, role = 'user' } = req.body;

            // Validaciones básicas
            if (!username || !password) {
                return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
            }

            // Verificar si el usuario ya existe
            const [existingUsers] = await db.pool.execute(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'El usuario ya existe' });
            }

            // Hash de la contraseña
            const passwordHash = await CryptoUtils.hashPassword(password);

            // Generar par de claves para el usuario (si es necesario)
            const keyPair = CryptoUtils.generateKeyPair();

            // Insertar usuario en la base de datos
            const [result] = await db.pool.execute(
                'INSERT INTO users (username, password_hash, email, role, public_key, private_key) VALUES (?, ?, ?, ?, ?, ?)',
                [username, passwordHash, email, role, keyPair.publicKey, keyPair.privateKey]
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                userId: result.insertId
            });

        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Login de usuario
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validaciones básicas
            if (!username || !password) {
                return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
            }

            // Buscar usuario en la base de datos
            const [users] = await db.pool.execute(
                'SELECT id, username, password_hash, role FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const user = users[0];

            // Verificar contraseña
            const isValidPassword = await CryptoUtils.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            // Generar token JWT
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Verificar token (opcional)
    static async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ error: 'Token no proporcionado' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Buscar información actualizada del usuario
            const [users] = await db.pool.execute(
                'SELECT id, username, role FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Usuario no encontrado' });
            }

            res.json({
                valid: true,
                user: users[0]
            });

        } catch (error) {
            res.status(401).json({ 
                valid: false, 
                error: 'Token inválido o expirado' 
            });
        }
    }
}

module.exports = AuthController;