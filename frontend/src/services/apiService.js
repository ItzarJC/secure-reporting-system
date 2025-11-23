// frontend/src/services/apiService.js
import axios from 'axios';
import CryptoClient from '../utils/cryptoClient';
import { SERVER_PUBLIC_KEY } from '../config/keys';

class ApiService {
    constructor() {
        this.serverPublicKey = SERVER_PUBLIC_KEY;
        console.log('🔑 Clave pública cargada:', this.serverPublicKey ? '✅' : '❌');
        this.verifyKey();
    }

    verifyKey() {
        if (!this.serverPublicKey) {
            console.error('❌ Clave pública no disponible');
            return false;
        }

        if (!CryptoClient.validatePublicKey(this.serverPublicKey)) {
            console.error('❌ Formato de clave pública inválido');
            return false;
        }

        console.log('✅ Clave pública verificada correctamente');
        return true;
    }

    async submitSecureReport(reportData) {
        try {
            console.log('📤 Enviando reporte seguro...');
            
            if (!this.serverPublicKey) {
                throw new Error('Clave pública del servidor no disponible');
            }

            // Validar datos del reporte
            if (!reportData.complainantName || !reportData.complainantId || !reportData.reportText) {
                throw new Error('Todos los campos del reporte son requeridos');
            }

            console.log('🔐 Creando paquete híbrido...');
            const encryptedPackage = CryptoClient.createHybridPackage(
                reportData, 
                this.serverPublicKey
            );

            console.log('📦 Paquete cifrado creado, enviando al servidor...');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await axios.post('/api/reports', {
                encryptedPackage
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Reporte enviado exitosamente');
            return response.data;

        } catch (error) {
            console.error('❌ Error enviando reporte:', error);
            
            // Mensajes de error más específicos
            if (error.response) {
                throw new Error(error.response.data.error || 'Error del servidor');
            } else if (error.request) {
                throw new Error('Error de conexión con el servidor');
            } else {
                throw new Error('Error enviando reporte: ' + error.message);
            }
        }
    }

    async login(username, password) {
        try {
            const response = await axios.post('/api/auth/login', {
                username, password
            });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await axios.post('/api/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    async getReportStatus(receiptId) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/reports/${receiptId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estado:', error);
            throw error;
        }
    }

     // Obtener todos los reportes (solo para fiscales/admin)
    async getAllReports() {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo reportes:', error);
            throw error;
        }
    }

    // Actualizar estado de un reporte
    async updateReportStatus(reportId, status) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`/api/reports/${reportId}/status`, 
                { status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error actualizando estado:', error);
            throw error;
        }
    }
    
}

export default new ApiService();