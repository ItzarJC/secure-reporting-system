// frontend/src/components/FiscalDashboard.js
import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService';

const FiscalDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const allReports = await ApiService.getAllReports();
      setReports(allReports);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setError('Error al cargar los reportes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      await ApiService.updateReportStatus(reportId, newStatus);
      // Recargar los reportes después de actualizar
      await loadReports();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError('Error al actualizar el estado: ' + error.message);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Función para obtener el color del estado
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 'under_review':
        return { backgroundColor: '#d1ecf1', color: '#0c5460' };
      case 'resolved':
        return { backgroundColor: '#d4edda', color: '#155724' };
      default:
        return { backgroundColor: '#f8f9fa', color: '#6c757d' };
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '⏳ Pendiente';
      case 'under_review':
        return '🔍 En Revisión';
      case 'resolved':
        return '✅ Resuelto';
      default:
        return '❓ Desconocido';
    }
  };

  return (
    <div className="fiscal-dashboard">
      <h2>📊 Panel de Fiscal - Reportes Recibidos</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={loadReports} 
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Cargando...' : '🔄 Actualizar Reportes'}
        </button>
        <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
          {reports.length} reporte(s) encontrado(s)
        </span>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#000000',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Cargando reportes...</p>
      ) : reports.length === 0 ? (
        <p>No hay reportes pendientes.</p>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card" style={{
              border: '1px solid #000000',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: '#000000'
            }}>
              <div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>📋 Reporte #{report.id}</h3>
                  <p><strong>Denunciante:</strong> {report.complainantName || 'No disponible'}</p>
                  <p><strong>ID Denunciante:</strong> {report.complainantId || 'No disponible'}</p>
                  <p><strong>Reporte:</strong> {report.reportText || 'No disponible'}</p>
                  <p><strong>Enviado por:</strong> {report.submittedBy || 'Usuario desconocido'}</p>
                  <p><strong>Fecha:</strong> {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Fecha no disponible'}</p>
                  <p><strong>Firma Digital:</strong></p>
                  <span style={{ 
                    fontSize: '12px', 
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    display: 'block',
                    marginTop: '5px',
                    backgroundColor: '#000000',
                    padding: '5px',
                    borderRadius: '3px'
                  }}>
                    {report.signature && report.signature !== 'unsigned' 
                      ? report.signature.substring(0, 50) + '...' 
                      : 'Sin firma'}
                  </span>
                </div>
                
                <div>
                  <p><strong>Estado Actual:</strong></p>
                  <select 
                    value={report.status || 'pending'} 
                    onChange={(e) => updateReportStatus(report.id, e.target.value)}
                    style={{ 
                      padding: '8px', 
                      marginBottom: '10px',
                      width: '100%',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="pending">⏳ Pendiente</option>
                    <option value="under_review">🔍 En Revisión</option>
                    <option value="resolved">✅ Resuelto</option>
                  </select>
                  
                  <div style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    borderRadius: '4px',
                    ...getStatusStyle(report.status)
                  }}>
                    {getStatusText(report.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FiscalDashboard;