# 🔐 Sistema Seguro de Reportes - Universidad

Sistema de reportes anónimos con múltiples capas de seguridad para proteger la identidad de denunciantes.

## 🛠️ Tecnologías

- **Frontend**: React.js, CryptoJS, Axios
- **Backend**: Node.js, Express.js, JWT, Bcrypt  
- **Base de Datos**: MySQL
- **Criptografía**: AES-256, RSA, Firmas Digitales

## 🏗️ Arquitectura del Sistema
Cliente (React) ↔️ Backend (Node.js) ↔️ Base de Datos (MySQL)
↧ ↧ ↧
Cifrado Híbrido Procesamiento Seguro Almacenamiento Cifrado
AES + RSA (AES-256)

text

## 🔐 Gestión de Claves

### Llave Simétrica (AES-256)
- **Almacenamiento**: Variable de entorno `STORAGE_ENCRYPTION_KEY`
- **Formato**: 32 bytes (64 caracteres hex)
- **Uso**: Cifrado de datos sensibles en base de datos
- **Generación**: `crypto.randomBytes(32).toString('hex')`

### Vector de Inicialización (IV)
- **Generación**: Aleatorio por cada cifrado
- **Almacenamiento**: Junto con datos cifrados  
- **Longitud**: 16 bytes

## 🔄 Flujo de Cifrado Híbrido

### 1. Cliente → Servidor (Cifrado)
Generar clave simétrica temporal (KS)
Cifrar datos con AES-256 usando KS
"Cifrar" KS con RSA usando clave pública del servidor
Enviar { KS_cifrada, datos_cifrados, IV }
text

### 2. Servidor → Almacenamiento (Re-cifrado)
Descifrar KS con clave privada RSA
Descifrar datos con AES usando KS
Re-cifrar datos con AES-256 clave maestra
Almacenar en BD con IV
text

## 🚀 Instalación

### Prerrequisitos
- Node.js 16+
- MySQL 8.0+

### Backend
```bash
cd backend
npm install
npm start
Frontend

bash
cd frontend  
npm install
npm start
🔧 Configuración de Seguridad

Configuración Automática de Claves

El proyecto incluye un sistema automático para generar todas las claves de seguridad necesarias:

1. Ejecutar el Script de Configuración

bash
cd backend
node setupAndVerify.js
Este script generará automáticamente:

✅ JWT_SECRET (64 bytes seguros)
✅ STORAGE_ENCRYPTION_KEY (AES-256, 32 bytes)
✅ SERVER_PRIVATE_KEY y SERVER_PUBLIC_KEY (RSA 2048 bits)
✅ Archivo .env con todas las claves
✅ Archivo server_public.pem con la clave pública
2. Configurar la Clave Pública en el Frontend

Después de ejecutar el script:

Opción A: Archivo de configuración

Copia el contenido de server_public.pem
Pégala en frontend/src/config/keys.js:
javascript
export const SERVER_PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
...clave_generada_automaticamente...
-----END RSA PUBLIC KEY-----`;
Opción B: Variable de entorno

Agrega al frontend/.env:
env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SERVER_PUBLIC_KEY=-----BEGIN RSA PUBLIC KEY-----\n...clave...\n-----END RSA PUBLIC KEY-----
En frontend/src/config/keys.js:
javascript
export const SERVER_PUBLIC_KEY = process.env.REACT_APP_SERVER_PUBLIC_KEY?.replace(/\\n/g, '\n');
3. Configurar Base de Datos

Edita manualmente el backend/.env generado con tus credenciales de MySQL:

env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_real_mysql
DB_NAME=secure_reporting
Estructura de Claves Generadas

text
🔐 CLAVES DE SEGURIDAD
├── JWT_SECRET (64 bytes)
│   └── Para tokens de autenticación
├── STORAGE_ENCRYPTION_KEY (32 bytes)
│   └── Cifrado AES-256 de datos en BD
├── SERVER_PRIVATE_KEY (RSA 2048)
│   └── Descifrado de claves simétricas
└── SERVER_PUBLIC_KEY (RSA 2048)
    └── Enviada al frontend para cifrado híbrido
Verificación de la Configuración

Después de configurar, ejecuta:

bash
cd backend
node verifyComplete.js
Este script verificará que:

✅ Todas las claves están configuradas correctamente
✅ El cifrado AES-256 funciona
✅ Las firmas RSA son válidas
✅ La base de datos es accesible
📋 Demostraciones

NOTA: Después de crear la base de datos (ejecutar database/schema.sql) y crear los usuarios con roles user y prosecutor (incluidos en el script de BD):

Iniciar sesión como "user"
Realizar un reporte
Cerrar sesión
Iniciar sesión como usuario "prosecutor"
Observar los reportes creados con información descifrada
Realizar cambios del estado del reporte
1. Verificación de Bcrypt en BD

sql
SELECT username, password_hash FROM users;
-- Los passwords deben ser hashes, no texto plano
2. Campos Sensibles Cifrados

sql
SELECT 
  complainant_name_encrypted,
  complainant_id_encrypted, 
  report_text_encrypted
FROM reports;
-- Todos los campos deben ser texto cifrado ilegible
3. Firmas Digitales

sql
SELECT id, digital_receipt FROM reports;
-- digital_receipt contiene firmas RSA en base64
4. Cifrado Híbrido

Enviar reporte desde frontend
Ver logs del backend mostrando descifrado exitoso
🔒 Archivos de Configuración

backend/.env - Variables de entorno del backend
frontend/.env - Variables de entorno del frontend
database/schema.sql - Esquema de base de datos
📞 API Endpoints

POST /api/auth/register - Registro de usuario
POST /api/auth/login - Inicio de sesión
POST /api/reports - Crear reporte seguro
GET /api/reports/:id/status - Consultar estado
GET /api/reports - Listar reportes (solo fiscales)