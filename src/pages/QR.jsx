import { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'

function QR() {
  const [currentToken, setCurrentToken] = useState('')
  const baseUrl = window.location.origin

  const generateToken = useCallback(() => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `${timestamp}-${random}`
  }, [])

  const generateQR = useCallback(() => {
    const token = generateToken()
    setCurrentToken(token)
    console.log('QR generado:', `${baseUrl}?token=${token}`)
  }, [baseUrl, generateToken, setCurrentToken])

  useEffect(() => {
    // Generate initial QR
    generateQR()

    // Regenerate QR every 30 seconds
    const interval = setInterval(() => {
      generateQR()
    }, 30000)

    return () => clearInterval(interval)
  }, [generateQR])

  const qrUrl = `${baseUrl}?token=${currentToken}`

  return (
    <div className="glass-container">
      <div className="qr-container">
        {currentToken && (
          <QRCode
            value={qrUrl}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        )}
      </div>
    </div>
  )
}

export default QR
