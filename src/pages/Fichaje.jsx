import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Fichaje({ currentUser, fichajes, addFichaje, logout }) {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const navigate = useNavigate()

  const registrarFichaje = (tipo) => {
    const fichaje = addFichaje(tipo)
    
    // Show success message
    setMessage(`✅ ${tipo.toUpperCase()} registrada correctamente`)
    setMessageType('success')
    
    // Hide message after 3 seconds
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)

    // Simulate DB save
    console.log('Enviando a BD:', fichaje)
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
      
      <button onClick={() => navigate('/')}>
        🏠 Volver al Menú
      </button>
      
      <button className="secondary" onClick={logout}>
        🔓 Cerrar Sesión
      </button>
      
      {message && (
        <div className={messageType} style={{ display: 'block' }}>
          {message}
        </div>
      )}
      
      <div className="fichajes-list">
        <strong>Últimos fichajes:</strong>
        <div>{renderFichajes()}</div>
      </div>
    </div>
  )
}

export default Fichaje
