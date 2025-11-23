// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear reporte seguro
router.post('/', ReportController.createReport);

// Obtener reportes (solo para fiscales/admin)
router.get('/', requireRole(['admin', 'prosecutor']), ReportController.getReports);

// Obtener estado de un reporte específico
router.get('/:id/status', ReportController.getReportStatus);

// Actualizar estado del reporte (solo admin/fiscal)
router.patch('/:id/status', requireRole(['admin', 'prosecutor']), ReportController.updateReportStatus);

module.exports = router;