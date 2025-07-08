import axios from 'axios';
import fichajeData from '../data/fichajes.json';

// Create axios instance with base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Add token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for consistent error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || 'Error de conexión al servidor';
    console.error('API error:', errorMessage, error);
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status || 500,
      details: error.response?.data?.data || []
    });
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    try {
      // Try first with the local data file
      const user = fichajeData.users.find(u => u.username === username && u.password === password);
      
      if (user) {
        // Create authentication data
        const authData = {
          user: {
            id: user.id,
            username: user.username,
            nombre_completo: user.nombre_completo,
            role: user.role
          },
          token: `local-token-${Date.now()}`
        };
        
        // Store in localStorage
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        return authData;
      }
      
      // If not in local data, try with API
      const response = await API.post('/auth/login', { username, password });
      // Store the token in localStorage
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data.data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Usuario o contraseña incorrectos');
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Validate a token (for QR login)
  validateToken: async (token) => {
    try {
      // Check if it's a local token
      if (token.startsWith('local-token-')) {
        return true;
      }
      
      // Check if it's a demo token
      if (token.startsWith('demo-token-')) {
        return true;
      }
      
      // Simple format validation for QR tokens
      // Just checking if it follows the timestamp-random format
      const tokenParts = token.split('-');
      return tokenParts.length === 2 && !isNaN(tokenParts[0]);
    } catch {
      return false;
    }
  }
};

// Fichaje services
export const fichajeService = {
  // Check in or check out
  fichar: async (data) => {
    try {
      // Get current user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Generate a new fichaje entry
      const newFichaje = {
        id: fichajeData.fichajes.length + 1 + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        tipo: data.tipo || 'entrada',
        usuario: user.nombre_completo || user.username,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        username: user.username
      };
      
      // In a real app, this would be saved to the database
      // For now we'll simulate saving it in memory
      // Note: This won't persist between page refreshes without server-side functionality
      fichajeData.fichajes.push(newFichaje);
      
      // Save to localStorage for demo persistence between refreshes
      try {
        const savedFichajes = JSON.parse(localStorage.getItem('fichajes') || '[]');
        savedFichajes.push(newFichaje);
        localStorage.setItem('fichajes', JSON.stringify(savedFichajes));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      
      console.log('Nuevo fichaje registrado:', newFichaje);
      
      // Return the new fichaje entry
      return newFichaje;
    } catch (error) {
      console.error('Error en fichaje:', error);
      throw error;
    }
  },
  
  // Get all fichajes for current user
  getFichajes: async (params = {}) => {
    try {
      // Get current user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Combine fichajes from the data file and any saved in localStorage
      let allFichajes = [...fichajeData.fichajes];
      
      // Add any fichajes saved to localStorage during this session
      try {
        const savedFichajes = JSON.parse(localStorage.getItem('fichajes') || '[]');
        allFichajes = [...allFichajes, ...savedFichajes];
      } catch (e) {
        console.warn('Could not read from localStorage:', e);
      }
      
      // Filter fichajes based on user role and parameters
      let filteredFichajes = [...allFichajes];
      
      // If not admin or supervisor, only show current user's fichajes
      if (user.role !== 'admin' && user.role !== 'supervisor') {
        filteredFichajes = filteredFichajes.filter(f => f.username === user.username);
      }
      
      // Apply date filters if provided
      if (params.start && params.end) {
        filteredFichajes = filteredFichajes.filter(f => {
          const fichajeDate = f.fecha;
          return fichajeDate >= params.start && fichajeDate <= params.end;
        });
      }
      
      // Sort by date (newest first) and deduplicate by ID
      filteredFichajes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Remove duplicates (in case localStorage has some entries from the data file)
      const uniqueIds = new Set();
      filteredFichajes = filteredFichajes.filter(f => {
        if (uniqueIds.has(f.id)) return false;
        uniqueIds.add(f.id);
        return true;
      });
      
      return filteredFichajes;
    } catch (error) {
      console.error('Error getting fichajes:', error);
      return [];
    }
  },
  
  // Get reports (admin only)
  getReports: async (params = {}) => {
    try {
      // Get current user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Only admins and supervisors can access reports
      if (user.role !== 'admin' && user.role !== 'supervisor') {
        throw new Error('No tienes permiso para ver reportes');
      }
      
      // Combine fichajes from the data file and any saved in localStorage
      let allFichajes = [...fichajeData.fichajes];
      
      // Add any fichajes saved to localStorage during this session
      try {
        const savedFichajes = JSON.parse(localStorage.getItem('fichajes') || '[]');
        allFichajes = [...allFichajes, ...savedFichajes];
      } catch (e) {
        console.warn('Could not read from localStorage:', e);
      }
      
      // Group all fichajes by username
      const userFichajes = {};
      
      // Filter by date if provided
      let filteredFichajes = [...allFichajes];
      
      if (params.start && params.end) {
        filteredFichajes = filteredFichajes.filter(f => {
          const fichajeDate = f.fecha;
          return fichajeDate >= params.start && fichajeDate <= params.end;
        });
      }
      
      // Remove duplicates (in case localStorage has some entries from the data file)
      const uniqueIds = new Set();
      filteredFichajes = filteredFichajes.filter(f => {
        if (uniqueIds.has(f.id)) return false;
        uniqueIds.add(f.id);
        return true;
      });
      
      // Group fichajes by username
      filteredFichajes.forEach(fichaje => {
        const username = fichaje.username;
        
        if (!userFichajes[username]) {
          // Find the user info
          const userInfo = fichajeData.users.find(u => u.username === username) || { 
            nombre_completo: fichaje.usuario 
          };
          
          userFichajes[username] = {
            username,
            nombre_completo: userInfo.nombre_completo,
            fichajes: []
          };
        }
        
        userFichajes[username].fichajes.push(fichaje);
      });
      
      // Sort fichajes for each user by date
      Object.values(userFichajes).forEach(userData => {
        userData.fichajes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      
      // Convert to array and sort by username
      return Object.values(userFichajes).sort((a, b) => a.username.localeCompare(b.username));
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  },

  // Get a QR token
  getQRToken: async () => {
    try {
      // Try using the API first
      const response = await API.get('/fichaje/token');
      return response.data.data.token;
    } catch (error) {
      // Generate a local token
      console.log('Using local token generation:', error.message);
      return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }
  }
};

export default { authService, fichajeService };
