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
cp .env.example .env
# Configurar variables en .env
npm start
Frontend

bash
cd frontend  
npm install
npm start
📋 Demostraciones

NOTA: Después de crear la base de datos (ejecutar database/schema.sql) y crear los usuarios con roles user y prosecutor (incluidos en el script de BD):

1. Iniciar sesión como "user"
2. Realizar un reporte
3. Cerrar sesión
4. Iniciar sesión como usuario "prosecutor"
5. Observar los reportes creados con información descifrada
6. Realizar cambios del estado del reporte



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