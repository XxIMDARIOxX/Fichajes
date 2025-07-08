import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'

function QRGenerator({ baseUrl = 'https://fichaje-web.com/login' }) {
  const [currentToken, setCurrentToken] = useState('')
  const [countdown, setCountdown] = useState(3)

  const generateToken = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `${timestamp}-${random}`
  }

  useEffect(() => {
    // Define generateQR inside the useEffect to avoid dependency issues
    const generateQR = () => {
      const token = generateToken()
      setCurrentToken(token)
      console.log('QR generado:', `${baseUrl}?token=${token}`)
    }
    
    // Generate initial QR
    generateQR()

    // Update every second
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          generateQR()
          return 3
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [baseUrl])

  const qrUrl = `${baseUrl}?token=${currentToken}`

  return (
    <div className="glass-container">
      <div className="glass-title">📱 FichajeQR</div>
      
      <div className="qr-container">
        {currentToken && (
          <QRCode
            value={qrUrl}
            size={180}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        )}
      </div>
      
      <div className="timer">
        <div>
          <span className="status"></span>
          Código activo
        </div>
        <div className="countdown">{countdown}</div>
      </div>
    </div>
  )
}

export default QRGenerator
