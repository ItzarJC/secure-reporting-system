// backend/verifyComplete.js
require('dotenv').config();
const crypto = require('crypto');

console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA\n');

// 1. Verificar que el archivo .env existe y se carga
console.log('1. VERIFICANDO ARCHIVO .env');
try {
  require('fs').accessSync('.env');
  console.log('   ✅ Archivo .env encontrado');
} catch (e) {
  console.log('   ❌ Archivo .env NO encontrado');
  process.exit(1);
}

// 2. Verificar variables de entorno
console.log('\n2. VERIFICANDO VARIABLES DE ENTORNO');
const variables = {
  JWT_SECRET: { minLength: 64, type: 'hex' },
  STORAGE_ENCRYPTION_KEY: { minLength: 64, type: 'hex' },
  SERVER_PRIVATE_KEY: { minLength: 100, type: 'key' },
  SERVER_PUBLIC_KEY: { minLength: 100, type: 'key' },
  DB_HOST: { minLength: 1, type: 'string' },
  DB_NAME: { minLength: 1, type: 'string' }
};

let allPassed = true;

Object.keys(variables).forEach(key => {
  const value = process.env[key];
  const spec = variables[key];
  
  if (!value) {
    console.log(`   ❌ ${key}: NO DEFINIDA`);
    allPassed = false;
    return;
  }
  
  if (value.length < spec.minLength) {
    console.log(`   ❌ ${key}: Muy corta (${value.length} < ${spec.minLength})`);
    allPassed = false;
    return;
  }
  
  if (spec.type === 'hex') {
    try {
      Buffer.from(value, 'hex');
    } catch (e) {
      console.log(`   ❌ ${key}: Formato hexadecimal inválido`);
      allPassed = false;
      return;
    }
  }
  
  if (spec.type === 'key' && !value.includes('BEGIN')) {
    console.log(`   ❌ ${key}: No parece una clave válida`);
    allPassed = false;
    return;
  }
  
  console.log(`   ✅ ${key}: Correcta (${value.length} caracteres)`);
});

// 3. Verificar funcionalidad criptográfica CORREGIDA
console.log('\n3. VERIFICANDO FUNCIONALIDAD CRIPTOGRÁFICA');
try {
  if (process.env.STORAGE_ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.STORAGE_ENCRYPTION_KEY, 'hex');
    const testData = "test de cifrado";
    
    // ✅ FORMA CORRECTA EN NODE.JS MODERNO
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(testData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    console.log('   ✅ Cifrado AES-256-GCM: Funcionando');
    
    // Verificar que también podemos descifrar
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    if (decrypted === testData) {
      console.log('   ✅ Descifrado AES-256-GCM: Funcionando');
    } else {
      console.log('   ❌ Descifrado AES-256-GCM: Error - datos no coinciden');
      allPassed = false;
    }
  }
} catch (e) {
  console.log('   ❌ Cifrado AES-256-GCM: Error -', e.message);
  allPassed = false;
}

// 4. Verificar funcionalidad RSA
console.log('\n4. VERIFICANDO FUNCIONALIDAD RSA');
try {
  if (process.env.SERVER_PRIVATE_KEY && process.env.SERVER_PUBLIC_KEY) {
    const publicKey = process.env.SERVER_PUBLIC_KEY.replace(/\\n/g, '\n');
    const privateKey = process.env.SERVER_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const testData = "test de firma digital";
    
    // Verificar firma digital
    const sign = crypto.createSign('SHA256');
    sign.update(testData);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');
    
    const verify = crypto.createVerify('SHA256');
    verify.update(testData);
    verify.end();
    const isValid = verify.verify(publicKey, signature, 'base64');
    
    if (isValid) {
      console.log('   ✅ Firma digital RSA: Funcionando');
    } else {
      console.log('   ❌ Firma digital RSA: Error - verificación falló');
      allPassed = false;
    }
    
    // Verificar cifrado asimétrico
    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(testData));
    const decrypted = crypto.privateDecrypt(privateKey, encrypted);
    
    if (decrypted.toString() === testData) {
      console.log('   ✅ Cifrado asimétrico RSA: Funcionando');
    } else {
      console.log('   ❌ Cifrado asimétrico RSA: Error - datos no coinciden');
      allPassed = false;
    }
  }
} catch (e) {
  console.log('   ❌ Funcionalidad RSA: Error -', e.message);
  allPassed = false;
}

// 5. Resultado final
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
  console.log('🚀 El sistema está listo para usar');
} else {
  console.log('❌ Algunas verificaciones fallaron');
}
console.log('='.repeat(50));

// 6. Próximos pasos
if (allPassed) {
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('1. Inicia el servidor: npm start');
  console.log('2. Verifica en el navegador: http://localhost:3001/api/debug-env');
  console.log('3. El frontend puede obtener la clave pública en: /api/auth/public-key');
}