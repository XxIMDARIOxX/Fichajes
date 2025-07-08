import { useState } from 'react'

function FichajeSystem({ onLogin }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [fichajes, setFichajes] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const users = {
    'admin': 'password123',
    'empleado1': 'emp123',
    'supervisor': 'super456'
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    
    if (users[username] && users[username] === password) {
      setCurrentUser(username)
      if (onLogin) onLogin(username)
    } else {
      setError('Usuario o contraseña incorrectos')
    }
  }

  const registrarFichaje = (tipo) => {
    const now = new Date()
    const fichaje = {
      id: Date.now(),
      usuario: currentUser,
      tipo: tipo,
      timestamp: now.toISOString(),
      fecha: now.toLocaleDateString('es-ES'),
      hora: now.toLocaleTimeString('es-ES')
    }

    setFichajes(prevFichajes => [fichaje, ...prevFichajes].slice(0, 10))
    console.log('Fichaje registrado:', fichaje)
  }

  const logout = () => {
    setCurrentUser(null)
    setUsername('')
    setPassword('')
    setError('')
  }

  const renderFichajes = () => {
    if (fichajes.length === 0) {
      return <div className="fichaje-item">No hay fichajes registrados</div>
    }

    return fichajes.map(f => (
      <div key={f.id} className="fichaje-item">
        <span className={f.tipo}>{f.tipo.toUpperCase()}</span> - 
        {f.fecha} {f.hora}
      </div>
    ))
  }

  if (!currentUser) {
    return (
      <div className="container">
        <h1 className="title">🔐 Sistema de Fichaje</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit">Iniciar Sesión</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    )
  }

  const now = new Date()
  const timeStr = now.toLocaleString('es-ES')

  return (
    <div className="container">
      <div className="welcome">
        👋 Bienvenido, <strong>{currentUser}</strong><br />
        <small>{timeStr}</small>
      </div>
      
      <button className="entrada" onClick={() => registrarFichaje('entrada')}>
        ⏰ Fichar Entrada
      </button>
      
      <button className="salida" onClick={() => registrarFichaje('salida')}>
        🚪 Fichar Salida
      </button>
      
      <button className="secondary" onClick={logout}>
        🔓 Cerrar Sesión
      </button>
      
      <div className="fichajes-list">
        <strong>Últimos fichajes:</strong>
        <div>{renderFichajes()}</div>
      </div>
    </div>
  )
}

export default FichajeSystem
