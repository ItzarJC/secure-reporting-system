// backend/setupAndVerify.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureKeys() {
  console.log('🔐 GENERANDO CONFIGURACIÓN SEGURA...\n');
  
  // 1. JWT Secret (64 bytes = 512 bits)
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  console.log('✅ JWT_SECRET generado:', jwtSecret.length + ' caracteres');
  
  // 2. AES-256 Key (32 bytes = 256 bits)
  const aesKey = crypto.randomBytes(32).toString('hex');
  console.log('✅ STORAGE_ENCRYPTION_KEY generado:', aesKey.length + ' caracteres hex');
  
  // 3. RSA Key Pair
  console.log('🔄 Generando par de claves RSA...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    }
  });
  console.log('✅ Claves RSA generadas');

  // Formatear para .env
  const formattedPrivateKey = privateKey.replace(/\n/g, '\\n');
  const formattedPublicKey = publicKey.replace(/\n/g, '\\n');

  return { jwtSecret, aesKey, formattedPrivateKey, formattedPublicKey, publicKey };
}

function createEnvFile(keys) {
  const envContent = `# =============================================
# CONFIGURACIÓN SEGURA - GENERADA AUTOMÁTICAMENTE
# =============================================
PORT=3001
NODE_ENV=development

# =============================================
# BASE DE DATOS - ¡ACTUALIZA ESTOS DATOS!
# =============================================
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql_aqui
DB_NAME=secure_reporting

# =============================================
# CLAVES DE SEGURIDAD - NO COMPARTIR
# =============================================
JWT_SECRET=${keys.jwtSecret}
STORAGE_ENCRYPTION_KEY=${keys.aesKey}
SERVER_PRIVATE_KEY=${keys.formattedPrivateKey}
SERVER_PUBLIC_KEY=${keys.formattedPublicKey}
`;

  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('✅ Archivo .env creado');
}

function createPublicKeyFile(publicKey) {
  fs.writeFileSync(path.join(__dirname, 'server_public.pem'), publicKey);
  console.log('✅ Clave pública guardada en server_public.pem');
}

function verifyGeneratedConfig() {
  console.log('\n🔍 VERIFICANDO CONFIGURACIÓN...');
  
  // Cargar el .env recién creado
  require('dotenv').config();
  
  const errors = [];
  
  // Verificar JWT_SECRET
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET muy corto o no configurado');
  }
  
  // Verificar AES Key
  if (process.env.STORAGE_ENCRYPTION_KEY) {
    try {
      const keyBuffer = Buffer.from(process.env.STORAGE_ENCRYPTION_KEY, 'hex');
      if (keyBuffer.length !== 32) {
        errors.push('STORAGE_ENCRYPTION_KEY tamaño incorrecto');
      }
    } catch (e) {
      errors.push('STORAGE_ENCRYPTION_KEY formato inválido');
    }
  } else {
    errors.push('STORAGE_ENCRYPTION_KEY no configurado');
  }
  
  // Verificar SERVER_PRIVATE_KEY
  if (!process.env.SERVER_PRIVATE_KEY || !process.env.SERVER_PRIVATE_KEY.includes('BEGIN RSA PRIVATE KEY')) {
    errors.push('SERVER_PRIVATE_KEY no configurado correctamente');
  }
  
  if (errors.length === 0) {
    console.log('✅ TODAS LAS VERIFICACIONES PASARON');
    console.log('🎉 Configuración lista para usar!');
  } else {
    console.log('❌ Errores encontrados:');
    errors.forEach(error => console.log('   - ' + error));
  }
}

// Ejecutar todo
try {
  const keys = generateSecureKeys();
  createEnvFile(keys);
  createPublicKeyFile(keys.publicKey);
  verifyGeneratedConfig();
  
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('1. 📝 Edita el archivo .env y actualiza:');
  console.log('   - DB_PASSWORD: Tu contraseña de MySQL');
  console.log('   - DB_USER: Tu usuario de MySQL si no es "root"');
  console.log('2. 📁 Copia server_public.pem al frontend');
  console.log('3. 🚫 Añade .env a .gitignore si no está');
  console.log('4. 🚀 Ejecuta: npm start');
  
} catch (error) {
  console.log('❌ Error durante la configuración:', error.message);
}