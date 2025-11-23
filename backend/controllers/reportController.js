// backend/controllers/reportController.js
const db = require('../config/database');
const CryptoUtils = require('../utils/cryptoUtils');

class ReportController {
    // Crear reporte con cifrado híbrido
    static async createReport(req, res) {
        try {
            const { encryptedPackage } = req.body;
            const userId = req.user.id;

            console.log('📦 Recibiendo paquete cifrado del usuario:', userId);
            
            if (!encryptedPackage) {
                return res.status(400).json({ error: 'Paquete cifrado requerido' });
            }

            // 1. Descifrar el paquete híbrido
            console.log('🔓 Descifrando paquete híbrido...');
            const decryptedData = await ReportController.decryptHybridPackage(encryptedPackage);
            console.log('✅ Paquete descifrado correctamente');
            
            // 2. Cifrar datos sensibles para almacenamiento (AES)
            const storageKey = process.env.STORAGE_ENCRYPTION_KEY;
            const nameEncrypted = CryptoUtils.encryptSymmetric(
                decryptedData.complainantName, 
                storageKey
            );
            const idEncrypted = CryptoUtils.encryptSymmetric(
                decryptedData.complainantId, 
                storageKey
            );
            const reportEncrypted = CryptoUtils.encryptSymmetric(
                decryptedData.reportText, 
                storageKey
            );

            // 3. Generar recibo digital firmado
            const receiptData = JSON.stringify({
                timestamp: new Date().toISOString(),
                complainantId: decryptedData.complainantId,
                summary: decryptedData.reportText.substring(0, 100) + '...'
            });

            // Obtener clave privada del usuario para firmar
            const [users] = await db.pool.execute(
                'SELECT private_key FROM users WHERE id = ?',
                [userId]
            );

            let digitalSignature = 'unsigned';
            if (users.length > 0 && users[0].private_key) {
                digitalSignature = CryptoUtils.signData(receiptData, users[0].private_key);
                console.log('✅ Firma digital generada');
            } else {
                console.log('⚠️  Usuario sin clave privada, recibo sin firma');
            }

            // 4. Guardar en base de datos
            const [result] = await db.pool.execute(
                `INSERT INTO reports 
                 (user_id, complainant_name_encrypted, complainant_id_encrypted, 
                  report_text_encrypted, iv, digital_receipt, status) 
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    userId,
                    JSON.stringify(nameEncrypted),
                    JSON.stringify(idEncrypted),
                    JSON.stringify(reportEncrypted),
                    nameEncrypted.iv,
                    digitalSignature
                ]
            );

            console.log('💾 Reporte guardado en BD con ID:', result.insertId);

            // 5. Devolver recibo firmado al cliente
            const finalReceipt = {
                receiptId: result.insertId,
                timestamp: new Date().toISOString(),
                signature: digitalSignature,
                status: 'pending'
            };

            res.json({
                success: true,
                digitalReceipt: finalReceipt,
                message: 'Reporte creado exitosamente'
            });

        } catch (error) {
            console.error('❌ Error creating report:', error);
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        }
    }

    // Descifrado de paquete híbrido - CON SOPORTE PARA MODO DESARROLLO
    static async decryptHybridPackage(encryptedPackage) {
        try {
            console.log('🔍 Analizando paquete recibido...');
            
            const { encryptedKey, encryptedData, iv } = encryptedPackage;
            
            if (!encryptedKey || !encryptedData || !iv) {
                throw new Error('Paquete cifrado incompleto. Faltan: ' + 
                    (!encryptedKey ? 'encryptedKey ' : '') +
                    (!encryptedData ? 'encryptedData ' : '') +
                    (!iv ? 'iv' : '')
                );
            }
            
            console.log('✅ Estructura del paquete válida');
            
            let symmetricKey;
            
            // DETECTAR SI ES MODO DESARROLLO O PRODUCCIÓN
            if (ReportController.isDevelopmentMode(encryptedKey)) {
                console.log('🔓 MODO DESARROLLO: Descifrando clave simétrica simulada...');
                symmetricKey = ReportController.decryptDevelopmentKey(encryptedKey);
            } else {
                console.log('🔓 MODO PRODUCCIÓN: Descifrando clave simétrica con RSA real...');
                const privateKey = process.env.SERVER_PRIVATE_KEY.replace(/\\n/g, '\n');
                symmetricKey = CryptoUtils.decryptAsymmetric(encryptedKey, privateKey);
            }
            
            console.log('✅ Clave simétrica obtenida:', symmetricKey.substring(0, 16) + '...');
            
            // Descifrar datos con AES
            console.log('🔓 Descifrando datos con AES...');
            const decryptedData = CryptoUtils.decryptSymmetric(
                encryptedData,
                symmetricKey,
                iv,
                ''
            );
            
            console.log('✅ Datos descifrados correctamente');
            
            const parsedData = JSON.parse(decryptedData);
            
            // Validar campos requeridos
            if (!parsedData.complainantName || !parsedData.complainantId || !parsedData.reportText) {
                throw new Error('Datos descifrados incompletos. Campos requeridos: complainantName, complainantId, reportText');
            }
            
            console.log('📝 Datos recibidos:', {
                complainantName: parsedData.complainantName.substring(0, 10) + '...',
                complainantId: parsedData.complainantId.substring(0, 5) + '...',
                reportTextLength: parsedData.reportText.length
            });
            
            return parsedData;
        } catch (error) {
            console.error('❌ Error en decryptHybridPackage:', error);
            throw new Error('Error descifrando paquete híbrido: ' + error.message);
        }
    }

    // Detectar si es modo desarrollo
    static isDevelopmentMode(encryptedKey) {
        try {
            // En modo desarrollo, la clave "cifrada" es base64 que contiene pipes "|"
            const decoded = Buffer.from(encryptedKey, 'base64').toString();
            return decoded.includes('|');
        } catch (error) {
            // Si no es base64 válido, asumimos que es modo producción
            return false;
        }
    }

    // Descifrar clave en modo desarrollo
    static decryptDevelopmentKey(encryptedKey) {
        try {
            const decoded = Buffer.from(encryptedKey, 'base64').toString();
            const parts = decoded.split('|');
            
            if (parts.length >= 1) {
                // La primera parte es la clave simétrica real
                const symmetricKey = parts[0];
                console.log('🔑 Clave desarrollo extraída:', symmetricKey.substring(0, 16) + '...');
                return symmetricKey;
            } else {
                throw new Error('Formato de clave desarrollo inválido');
            }
        } catch (error) {
            throw new Error('Error descifrando clave desarrollo: ' + error.message);
        }
    }

    // Obtener reportes (solo para fiscales/admin)
    static async getReports(req, res) {
        try {
            const [reports] = await db.pool.execute(`
                SELECT r.*, u.username 
                FROM reports r 
                JOIN users u ON r.user_id = u.id 
                ORDER BY r.created_at DESC
            `);

            // Para usuarios normales, solo devolver información básica
            if (req.user.role === 'user') {
                const basicReports = reports.map(report => ({
                    id: report.id,
                    status: report.status,
                    createdAt: report.created_at,
                    hasSignature: report.digital_receipt !== 'unsigned'
                }));
                return res.json(basicReports);
            }

            // Para fiscales/admin, descifrar datos completos
            const storageKey = process.env.STORAGE_ENCRYPTION_KEY;
            const decryptedReports = await Promise.all(
                reports.map(async (report) => {
                    try {
                        const nameData = JSON.parse(report.complainant_name_encrypted);
                        const idData = JSON.parse(report.complainant_id_encrypted);
                        const reportData = JSON.parse(report.report_text_encrypted);

                        return {
                            id: report.id,
                            complainantName: CryptoUtils.decryptSymmetric(
                                nameData.encryptedData,
                                storageKey,
                                nameData.iv,
                                nameData.authTag
                            ),
                            complainantId: CryptoUtils.decryptSymmetric(
                                idData.encryptedData,
                                storageKey,
                                idData.iv,
                                idData.authTag
                            ),
                            reportText: CryptoUtils.decryptSymmetric(
                                reportData.encryptedData,
                                storageKey,
                                reportData.iv,
                                reportData.authTag
                            ),
                            status: report.status,
                            createdAt: report.created_at,
                            signature: report.digital_receipt,
                            submittedBy: report.username
                        };
                    } catch (error) {
                        console.error('Error descifrando reporte ID:', report.id, error);
                        return {
                            id: report.id,
                            error: 'Error descifrando datos',
                            status: report.status,
                            createdAt: report.created_at
                        };
                    }
                })
            );

            res.json(decryptedReports);
        } catch (error) {
            console.error('Error getting reports:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Obtener estado de un reporte
    static async getReportStatus(req, res) {
        try {
            const reportId = req.params.id;
            const userId = req.user.id;

            const [reports] = await db.pool.execute(
                'SELECT id, status, created_at, digital_receipt FROM reports WHERE id = ? AND user_id = ?',
                [reportId, userId]
            );

            if (reports.length === 0) {
                return res.status(404).json({ error: 'Reporte no encontrado' });
            }

            const report = reports[0];
            res.json({
                id: report.id,
                status: report.status,
                createdAt: report.created_at,
                receiptSignature: report.digital_receipt
            });

        } catch (error) {
            console.error('Error getting report status:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Actualizar estado del reporte
    static async updateReportStatus(req, res) {
        try {
            const reportId = req.params.id;
            const { status } = req.body;

            if (!['pending', 'under_review', 'resolved'].includes(status)) {
                return res.status(400).json({ error: 'Estado inválido' });
            }

            const [result] = await db.pool.execute(
                'UPDATE reports SET status = ? WHERE id = ?',
                [status, reportId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reporte no encontrado' });
            }

            res.json({
                success: true,
                message: `Estado del reporte actualizado a: ${status}`
            });

        } catch (error) {
            console.error('Error updating report status:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}

module.exports = ReportController;