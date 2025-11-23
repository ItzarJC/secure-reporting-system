// frontend/src/components/SecureReportForm.js
import React, { useState } from 'react';
import ApiService from '../services/apiService';

const SecureReportForm = () => {
  const [formData, setFormData] = useState({
    complainantName: '',
    complainantId: '',
    reportText: '',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [digitalReceipt, setDigitalReceipt] = useState(null);
  const [receiptToCheck, setReceiptToCheck] = useState('');
  const [reportStatus, setReportStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      attachments: Array.from(e.target.files)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await ApiService.submitSecureReport(formData);
      setDigitalReceipt(result.digitalReceipt);
      alert('✅ Reporte enviado exitosamente. Guarde su recibo digital.');
    } catch (error) {
      console.error('Error enviando reporte:', error);
      alert('❌ Error enviando el reporte: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!receiptToCheck.trim()) {
      alert('Por favor ingrese el ID del recibo');
      return;
    }

    setCheckingStatus(true);
    try {
      const status = await ApiService.getReportStatus(receiptToCheck);
      setReportStatus(status);
    } catch (error) {
      console.error('Error consultando estado:', error);
      alert('❌ Error consultando el estado: ' + error.message);
      setReportStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: '⏳ Pendiente', color: '#fff3cd', textColor: '#856404' },
      under_review: { text: '🔍 En Revisión', color: '#d1ecf1', textColor: '#0c5460' },
      resolved: { text: '✅ Resuelto', color: '#d4edda', textColor: '#155724' }
    };
    
    const config = statusConfig[status] || { text: '❓ Desconocido', color: '#f8f9fa', textColor: '#6c757d' };
    
    return (
      <span style={{
        padding: '5px 10px',
        borderRadius: '15px',
        backgroundColor: config.color,
        color: config.textColor,
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="secure-report-form" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>📝 Reporte Seguro de Corrupción o Acoso</h2>
      
      {/* Sección de Consulta de Estado */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '30px',
        backgroundColor: '#000000'
      }}>
        <h3>🔍 Consultar Estado de Reporte</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Ingrese el ID del recibo"
            value={receiptToCheck}
            onChange={(e) => setReceiptToCheck(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              flex: 1
            }}
          />
          <button 
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: checkingStatus ? 'not-allowed' : 'pointer'
            }}
          >
            {checkingStatus ? 'Consultando...' : 'Consultar Estado'}
          </button>
        </div>

        {reportStatus && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            border: '1px solid #28a745',
            borderRadius: '4px',
            backgroundColor: '#647FBC'
          }}>
            <h4>📄 Información del Reporte</h4>
            <p><strong>ID del Reporte:</strong> {reportStatus.id}</p>
            <p><strong>Estado:</strong> {getStatusBadge(reportStatus.status)}</p>
            <p><strong>Fecha de Creación:</strong> {new Date(reportStatus.createdAt).toLocaleString()}</p>
            {reportStatus.receiptSignature && reportStatus.receiptSignature !== 'unsigned' && (
              <div>
                <p><strong>Firma Digital:</strong></p>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  backgroundColor: '#f8f9fa',
                  color: 'black',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}>
                  {reportStatus.receiptSignature.substring(0, 80)}...
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  <em>Esta firma garantiza la autenticidad de su reporte</em>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sección de Envío de Nuevo Reporte */}
      {digitalReceipt ? (
        <div style={{ 
          border: '2px solid #28a745', 
          borderRadius: '8px', 
          padding: '20px', 
          backgroundColor: '#d4edda'
        }}>
          <h3>✅ Recibo Digital Generado</h3>
          <p><strong>ID del Recibo:</strong> {digitalReceipt.receiptId}</p>
          <p><strong>Timestamp:</strong> {new Date(digitalReceipt.timestamp).toLocaleString()}</p>
          <p><strong>Estado Inicial:</strong> {getStatusBadge(digitalReceipt.status)}</p>
          <p><strong>Firma Digital:</strong></p>
          <div style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            marginBottom: '15px'
          }}>
            {digitalReceipt.signature.substring(0, 80)}...
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigator.clipboard.writeText(JSON.stringify(digitalReceipt))}
              style={{
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋 Copiar Recibo Completo
            </button>
            <button 
              onClick={() => {
                setDigitalReceipt(null);
                setFormData({
                  complainantName: '',
                  complainantId: '',
                  reportText: '',
                  attachments: []
                });
              }}
              style={{
                padding: '10px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📝 Enviar Otro Reporte
            </button>
          </div>
          
          <p style={{ marginTop: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>💡 Importante:</strong> Guarde este recibo para consultar el estado de su reporte posteriormente.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: 'black'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nombre del Denunciante:
            </label>
            <input
              type="text"
              name="complainantName"
              value={formData.complainantName}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              ID/Número de Identificación:
            </label>
            <input
              type="text"
              name="complainantId"
              value={formData.complainantId}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Descripción del Reporte:
            </label>
            <textarea
              name="reportText"
              value={formData.reportText}
              onChange={handleInputChange}
              rows="6"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Archivos Adjuntos (opcional):
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? '🔐 Enviando Reporte Seguro...' : '🔐 Enviar Reporte Seguro'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SecureReportForm;