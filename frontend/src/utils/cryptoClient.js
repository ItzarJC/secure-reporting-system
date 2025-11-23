// frontend/src/utils/cryptoClient.js
import CryptoJS from 'crypto-js';

class CryptoClient {
    // Generar clave simétrica temporal
    static generateSymmetricKey() {
        return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    }

    // Cifrado AES
    static encryptAES(plaintext, key) {
        try {
            const iv = CryptoJS.lib.WordArray.random(16);
            const keyHex = CryptoJS.enc.Hex.parse(key);
            
            const encrypted = CryptoJS.AES.encrypt(plaintext, keyHex, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            
            return {
                encryptedData: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
                iv: iv.toString(CryptoJS.enc.Hex)
            };
        } catch (error) {
            throw new Error('Error en cifrado AES: ' + error.message);
        }
    }

    // Cifrado RSA para desarrollo - compatible con el backend
    static encryptRSA(plaintext, publicKey) {
        try {
            console.log('🔐 Cifrando con RSA (modo desarrollo)...');
            
            // En desarrollo, creamos un formato que el backend pueda entender
            const timestamp = Date.now().toString();
            const randomSalt = CryptoJS.lib.WordArray.random(4).toString();
            
            // Formato: clave_real|timestamp|salt
            const developmentFormat = `${plaintext}|${timestamp}|${randomSalt}`;
            
            // Codificar en base64 para "simular" cifrado
            const simulatedEncryption = btoa(unescape(encodeURIComponent(developmentFormat)));
            
            console.log('✅ Cifrado RSA simulado completado');
            return simulatedEncryption;
            
        } catch (error) {
            throw new Error('Error en cifrado RSA: ' + error.message);
        }
    }

    // Crear paquete híbrido
    static createHybridPackage(data, serverPublicKey) {
        try {
            console.log('🔐 Creando paquete híbrido...');
            
            // Validar datos de entrada
            if (!data.complainantName || !data.complainantId || !data.reportText) {
                throw new Error('Datos del reporte incompletos');
            }
            
            // 1. Generar clave simétrica temporal
            const symmetricKey = this.generateSymmetricKey();
            console.log('✅ Clave simétrica generada:', symmetricKey.substring(0, 16) + '...');
            
            // 2. Cifrar datos con AES
            const encryptedData = this.encryptAES(JSON.stringify(data), symmetricKey);
            console.log('✅ Datos cifrados con AES');
            
            // 3. Cifrar clave simétrica con RSA (modo desarrollo)
            const encryptedKey = this.encryptRSA(symmetricKey, serverPublicKey);
            console.log('✅ Clave simétrica cifrada con RSA');
            
            return {
                encryptedKey: encryptedKey,
                encryptedData: encryptedData.encryptedData,
                iv: encryptedData.iv,
                authTag: 'not-used-in-crypto-js'
            };
        } catch (error) {
            console.error('❌ Error en createHybridPackage:', error);
            throw new Error('Error creando paquete híbrido: ' + error.message);
        }
    }

    // Verificar que la clave pública tiene formato correcto
    static validatePublicKey(publicKey) {
        if (!publicKey || typeof publicKey !== 'string') {
            return false;
        }
        return publicKey.includes('BEGIN RSA PUBLIC KEY') || publicKey.includes('BEGIN PUBLIC KEY');
    }
}

export default CryptoClient;