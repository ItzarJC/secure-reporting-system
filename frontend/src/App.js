// frontend/src/App.js
import React from 'react';
import './App.css';
import SecureReportForm from './components/SecureReportForm';
import LoginForm from './components/LoginForm';
import FiscalDashboard from './components/FiscalDashboard';

function App() {
  const [user, setUser] = React.useState(null);

  // Cargar usuario desde localStorage al iniciar
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔐 Sistema Seguro de Reportes</h1>
        
        {user ? (
          <div>
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#000000', borderRadius: '5px' }}>
              <p>👤 Bienvenido, <strong>{user.username}</strong> | Rol: <strong>{user.role}</strong></p>
              <button onClick={handleLogout} style={{ padding: '5px 10px', marginLeft: '10px' }}>
                Cerrar Sesión
              </button>
            </div>

            {user.role === 'prosecutor' || user.role === 'admin' ? (
              // Vista para Fiscales/Admin
              <FiscalDashboard />
            ) : (
              // Vista para Usuarios Normales
              <SecureReportForm />
            )}
          </div>
        ) : (
          <LoginForm onLogin={setUser} />
        )}
      </header>
    </div>
  );
}

export default App;