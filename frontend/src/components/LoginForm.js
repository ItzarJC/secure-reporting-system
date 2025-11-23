import React, { useState } from 'react';
import ApiService from '../services/apiService';

const LoginForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      let result;
      if (isLogin) {
        result = await ApiService.login(formData.username, formData.password);
        setMessage({ 
          text: `¡Bienvenido ${result.user.username}!`, 
          type: 'success' 
        });
        onLogin(result.user);
      } else {
        result = await ApiService.register(formData);
        alert("Usuario registrado con éxito");
        setFormData({ username: '', password: '', email: '' });
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (error) {
      setMessage({ 
        text: `❌ ${error.response?.data?.error || 'Error de conexión'}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
      
      {message.text && (
        <div style={{
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '15px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          color: message.type === 'success' ? '#155724' : '#721c24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{message.text}</span>
          <button 
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Usuario"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
            disabled={isLoading}
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
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        {!isLogin && (
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email (opcional)"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrar')}
        </button>
      </form>

      <button 
        onClick={() => {
          setIsLogin(!isLogin);
          setMessage({ text: '', type: '' });
        }} 
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px',
          background: 'none',
          border: 'none',
          color: isLoading ? '#6c757d' : '#007bff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginTop: '10px'
        }}
      >
        {isLogin ? '¿Necesitas una cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  );
};

export default LoginForm;