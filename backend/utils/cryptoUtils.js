// backend/utils/cryptoUtils.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class CryptoUtils {
    static AES_ALGORITHM = 'aes-256-gcm';
    static RSA_KEY_SIZE = 2048;
    
    // 1. Hashing de contraseñas
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // 2. Cifrado Simétrico (AES-256-GCM)
    static encryptSymmetric(plaintext, key) {
        try {
            const keyBuffer = Buffer.from(key, 'hex');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.AES_ALGORITHM, keyBuffer, iv);
            
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            throw new Error('Error en cifrado simétrico: ' + error.message);
        }
    }

    static decryptSymmetric(encryptedData, key, iv, authTag) {
        try {
            const keyBuffer = Buffer.from(key, 'hex');
            const ivBuffer = Buffer.from(iv, 'hex');
            
            // Si authTag está vacío (viene de CryptoJS), usar CBC para compatibilidad
            if (!authTag || authTag === 'not-used-in-crypto-js' || authTag === '') {
                console.log('🔓 Usando AES-CBC para compatibilidad con CryptoJS');
                const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
                
                let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                
                return decrypted;
            } else {
                // Usar GCM con authTag (para datos cifrados con nuestro propio sistema)
                console.log('🔓 Usando AES-GCM con auth tag');
                const authTagBuffer = Buffer.from(authTag, 'hex');
                const decipher = crypto.createDecipheriv(this.AES_ALGORITHM, keyBuffer, ivBuffer);
                decipher.setAuthTag(authTagBuffer);
                
                let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                
                return decrypted;
            }
        } catch (error) {
            throw new Error('Error descifrando: ' + error.message);
        }
    }

    // 3. Cifrado Asimétrico (RSA)
    static generateKeyPair() {
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: this.RSA_KEY_SIZE,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            }
        });
    }

    static encryptAsymmetric(plaintext, publicKey) {
        try {
            const publicKeyFormatted = publicKey.replace(/\\n/g, '\n');
            const buffer = Buffer.from(plaintext, 'utf8');
            const encrypted = crypto.publicEncrypt(publicKeyFormatted, buffer);
            return encrypted.toString('base64');
        } catch (error) {
            throw new Error('Error en cifrado asimétrico: ' + error.message);
        }
    }

    static decryptAsymmetric(encryptedData, privateKey) {
        try {
            const privateKeyFormatted = privateKey.replace(/\\n/g, '\n');
            const buffer = Buffer.from(encryptedData, 'base64');
            const decrypted = crypto.privateDecrypt(privateKeyFormatted, buffer);
            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error('Error descifrando asimétrico: ' + error.message);
        }
    }

    // 4. Firma Digital
    static signData(data, privateKey) {
        try {
            const privateKeyFormatted = privateKey.replace(/\\n/g, '\n');
            const sign = crypto.createSign('SHA256');
            sign.update(data);
            sign.end();
            return sign.sign(privateKeyFormatted, 'base64');
        } catch (error) {
            throw new Error('Error firmando datos: ' + error.message);
        }
    }

    static verifySignature(data, signature, publicKey) {
        try {
            const publicKeyFormatted = publicKey.replace(/\\n/g, '\n');
            const verify = crypto.createVerify('SHA256');
            verify.update(data);
            verify.end();
            return verify.verify(publicKeyFormatted, signature, 'base64');
        } catch (error) {
            throw new Error('Error verificando firma: ' + error.message);
        }
    }

    // 5. Generación de claves simétricas
    static generateSymmetricKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    // 6. Verificación de formato de clave
    static isValidPublicKey(publicKey) {
        try {
            if (!publicKey || typeof publicKey !== 'string') return false;
            if (!publicKey.includes('BEGIN RSA PUBLIC KEY')) return false;
            
            // Intentar usar la clave para verificar que es válida
            const testData = "test";
            const encrypted = this.encryptAsymmetric(testData, publicKey);
            return !!encrypted;
        } catch (error) {
            return false;
        }
    }

    // 7. Helper para generar IV
    static generateIV() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = CryptoUtils;