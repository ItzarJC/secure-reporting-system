-- database/schema.sql
CREATE DATABASE IF NOT EXISTS secure_reporting;
USE secure_reporting;

-- Tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'prosecutor') DEFAULT 'user',
    public_key TEXT,
    private_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN private_key TEXT;

-- Tabla de reportes
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    -- Datos cifrados simétricamente
    complainant_name_encrypted TEXT NOT NULL,
    complainant_id_encrypted TEXT NOT NULL,
    report_text_encrypted TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    -- Firma digital
    digital_receipt TEXT,
    signature_verified BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'under_review', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de archivos adjuntos
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT,
    file_name_encrypted TEXT NOT NULL,
    file_data_encrypted LONGBLOB NOT NULL,
    iv VARCHAR(64) NOT NULL,
    mime_type VARCHAR(255),
    FOREIGN KEY (report_id) REFERENCES reports(id)
);

--Crear usuario user para pruebas
INSERT INTO users (username, password_hash, email, role) 
VALUES (
    'Alejandro', 
    '$2b$12$vrWbn8LkDVThs5YV36ytAuymnI60ZIuo7dxE9puOpyhvOf4IxF9Lu', 
    'alejandro@universidad.edu', 
    'user'
);

--Crear usuario fiscal para pruebas
INSERT INTO users (username, password_hash, email, role) 
VALUES (
    'fiscal', 
    '$2b$12$iPRphPjMMGbpiRT9//1av.jl4UtQHIBOwfrMuqdNk1ShU6LvsUtc6', 
    'fiscal@universidad.edu', 
    'prosecutor'
);