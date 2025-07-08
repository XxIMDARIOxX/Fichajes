import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import QR from './pages/QR.jsx'
import Home from './pages/Home.jsx'
import { authService } from './services/api.js'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [hasValidToken, setHasValidToken] = useState(false)

  useEffect(() => {
    // Check if there's a valid token in URL (from QR scan)
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      // Validate token using the API
      authService.validateToken(token).then(isValid => {
        if (isValid) {
          setHasValidToken(true)
          // Remove token from URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }).catch(err => {
        console.error('Error validating token:', err)
      })
    }

    // Check if user is already logged in
    const user = authService.getCurrentUser()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  const login = async (username, password) => {
    // Test users for demo purposes - should match what's shown on login page
    const testUsers = {
      'admin': 'password123',
      'empleado1': 'emp123',
      'supervisor': 'super456'
    }
    
    try {
      // First check if it's a test user
      if (testUsers[username] && testUsers[username] === password) {
        // Create mock user data for test users
        const mockUserData = {
          user: {
            id: username === 'admin' ? 1 : (username === 'empleado1' ? 2 : 3),
            username: username,
            nombre_completo: username === 'admin' ? 'Administrador' : 
              (username === 'empleado1' ? 'Empleado Demo' : 'Supervisor Demo'),
            role: username === 'admin' ? 'admin' : 
              (username === 'supervisor' ? 'supervisor' : 'employee')
          },
          token: 'demo-token-' + Date.now()
        }
        
        localStorage.setItem('token', mockUserData.token);
        localStorage.setItem('user', JSON.stringify(mockUserData.user));
        setCurrentUser(mockUserData.user)
        return true
      }
      
      // If not a test user, try with the API
      const userData = await authService.login(username, password)
      setCurrentUser(userData.user)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    authService.logout()
    setCurrentUser(null)
    // Keep hasValidToken true so it shows the login page instead of QR
    // setHasValidToken(false)
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/" 
            element={
              currentUser ? (
                // If user is logged in, show control panel
                <Home 
                  currentUser={currentUser}
                  login={login}
                  logout={logout}
                />
              ) : !hasValidToken ? (
                // If no valid token, show QR code
                <QR />
              ) : (
                // If valid token but no user, show login
                <Home 
                  login={login}
                  logout={logout}
                />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
