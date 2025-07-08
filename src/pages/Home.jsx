import { useState } from 'react'
import mbeLogo from '../assets/images/MBE_vertical-logo.png'
import Reports from '../components/Reports'
import { fichajeService } from '../services/api'

function Home({ currentUser, login, logout, error: appError }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(appError || '')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [showReports, setShowReports] = useState(false)
  const [loading, setLoading] = useState(false)

  // Update local error if app error changes
  if (appError && appError !== error) {
    setError(appError)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await login(username.trim(), password.trim())
      if (!result) {
        setError('Usuario o contraseña incorrectos')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const registrarFichaje = async (tipo) => {
    setLoading(true)
    setError('')
    try {
      const data = {
        usuario: currentUser?.username || currentUser?.nombre_completo || 'usuario',
        tipo_ejecucion: 'manual',
        idusuario: currentUser?.id || 0,
        tipo: tipo // Specify whether it's entrada or salida
      }
      
      await fichajeService.fichar(data)
      
      // Show success message
      setMessage(`✅ ${tipo.toUpperCase()} registrada correctamente`)
      setMessageType('success')
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
      
    } catch (err) {
      console.error('Error al registrar fichaje:', err)
      setMessage(`❌ Error al registrar ${tipo}`)
      setMessageType('error')
      setError(err.message || `Error al registrar ${tipo}`)
      
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  // If user is logged in, show the fichaje menu directly
  if (currentUser) {
    const now = new Date()
    const timeStr = now.toLocaleString('es-ES')

    // Show reports if requested
    if (showReports) {
      return <Reports currentUser={currentUser} onBack={() => setShowReports(false)} />
    }

    return (
      <div className="container">
        <h1 className="title">
          <img src={mbeLogo} alt="MBE Logo" className="mbe-logo-img" />
        </h1>
        <div className="welcome">
          Bienvenido, <strong>{currentUser.nombre_completo || currentUser.username}</strong><br />
          <small>{timeStr}</small>
        </div>
        
        <button 
          className="entrada" 
          onClick={() => registrarFichaje('entrada')}
          disabled={loading}
        >
          {loading ? 'Procesando...' : '⏰ Fichar Entrada'}
        </button>
        
        <button 
          className="salida" 
          onClick={() => registrarFichaje('salida')}
          disabled={loading}
        >
          {loading ? 'Procesando...' : '🚪 Fichar Salida'}
        </button>
        
        {/* Only show reports button for admin users */}
        {currentUser.role === 'admin' && (
          <button 
            onClick={() => setShowReports(true)} 
            className="secondary"
            disabled={loading}
          >
            📊 Ver Reportes
          </button>
        )}
        
        <button 
          onClick={logout} 
          className="secondary"
          disabled={loading}
        >
          🔓 Cerrar Sesión
        </button>
        
        {message && (
          <div className={messageType} style={{ display: 'block' }}>
            {message}
          </div>
        )}
        
        {error && (
          <div className="error" style={{ marginTop: '10px' }}>
            {error}
          </div>
        )}
        
      </div>
    )
  }

  // Show login form when accessed via QR code
  return (
    <div className="container">
      <img src={mbeLogo} alt="MBE Logo" className="mbe-logo-img" />
      
      <div style={{ marginTop: '40px' }}>
        <form onSubmit={handleLogin}>
        <div className="form-group">
          <input 
            type="text" 
            id="username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            required 
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            id="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required 
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Procesando...' : 'Iniciar Sesión'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Usuarios de prueba:</strong></p>
        <p>admin / password123</p>
        <p>empleado1 / emp123</p>
        <p>supervisor / super456</p>
      </div>
    </div>
  )
}

export default Home
