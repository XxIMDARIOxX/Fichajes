import { useState, useEffect, useCallback } from 'react'
import { fichajeService } from '../services/api'

function Reports({ currentUser, onBack }) {
  const [fichajes, setFichajes] = useState([])
  const [reportType, setReportType] = useState('weekly')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  
  // Enforce admin access
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setError('Acceso denegado. Solo administradores pueden ver reportes.')
      setTimeout(() => {
        onBack();
      }, 2000);
    }
  }, [currentUser, onBack])

  useEffect(() => {
    // Set default dates
    const now = new Date()
    setSelectedWeek(getWeekRange(now))
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }, [])

  useEffect(() => {
    const loadFichajes = async () => {
      if (!selectedWeek && reportType === 'weekly') return
      if (!selectedMonth && reportType === 'monthly') return
      
      setLoading(true)
      setError('')
      
      try {
        // Prepare date parameters based on report type
        let params = {}
        
        if (reportType === 'weekly') {
          const [start, end] = selectedWeek.split(' - ')
          params = { start, end }
        } else {
          params = { 
            start: `${selectedMonth}-01`,
            end: `${selectedMonth}-31` // API will handle invalid dates
          }
        }
        
        // Load fichajes based on user role
        if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
          // Get all users' fichajes for admins and supervisors
          const data = await fichajeService.getReports(params);
          setFichajes(data);
        } else {
          // Get only current user's fichajes for regular users
          const data = await fichajeService.getFichajes(params);
          setFichajes(data);
        }
      } catch (err) {
        console.error('Error loading reports:', err);
        setError('No se pudieron cargar los reportes. ' + (err.message || ''));
        setFichajes([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFichajes();
  }, [currentUser, reportType, selectedWeek, selectedMonth]);

  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toISOString().split('T')[0]} - ${endOfWeek.toISOString().split('T')[0]}`;
  };

  const filterFichajes = () => {
    if (!fichajes || fichajes.length === 0) return [];
    
    // If we have admin/supervisor reports format (array of user objects with fichajes property)
    if (fichajes[0] && fichajes[0].fichajes) {
      let allFichajes = [];
      fichajes.forEach(userFichaje => {
        // Add user info to each fichaje
        userFichaje.fichajes.forEach(f => {
          allFichajes.push({
            ...f,
            usuario: userFichaje.nombre_completo,
            username: userFichaje.username
          });
        });
      });
      return allFichajes;
    }
    
    // For regular user format, return as is
    return fichajes;
  };

  const calculateSummary = (filteredFichajes) => {
    if (!filteredFichajes || filteredFichajes.length === 0) {
      return { entries: [] }
    }
    
    // Group fichajes by date
    const fichajeSummary = {};
    
    filteredFichajes.forEach(f => {
      const date = f.fecha;
      const user = f.usuario || 'Usuario';
      
      if (!fichajeSummary[date]) {
        fichajeSummary[date] = {};
      }
      
      if (!fichajeSummary[date][user]) {
        fichajeSummary[date][user] = {
          entrada: null,
          salida: null,
        };
      }
      
      // Save the check-in or check-out time
      if (f.tipo === 'entrada') {
        fichajeSummary[date][user].entrada = f.hora;
      } else if (f.tipo === 'salida') {
        fichajeSummary[date][user].salida = f.hora;
      }
    });
    
    // Format the entries for display
    const entries = [];
    Object.keys(fichajeSummary).sort().reverse().forEach(date => {
      Object.keys(fichajeSummary[date]).forEach(user => {
        entries.push({
          date,
          user,
          entrada: fichajeSummary[date][user].entrada || '-',
          salida: fichajeSummary[date][user].salida || '-'
        });
      });
    });
    
    return { entries }
  }

  // Function to save monthly report to database (localStorage for now)
  const saveMonthlyReport = useCallback(() => {
    if (reportType !== 'monthly' || !summary || !summary.entries || summary.entries.length === 0) {
      setSaveStatus('No hay datos mensuales para guardar');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    try {
      const monthlyReport = {
        month: selectedMonth,
        generateDate: new Date().toISOString(),
        entries: summary.entries,
      };
      
      // Get existing saved reports
      const existingReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
      
      // Check if we already have a report for this month
      const existingIndex = existingReports.findIndex(report => report.month === selectedMonth);
      
      if (existingIndex >= 0) {
        // Update existing report
        existingReports[existingIndex] = monthlyReport;
      } else {
        // Add new report
        existingReports.push(monthlyReport);
      }
      
      // Save back to localStorage
      localStorage.setItem('savedReports', JSON.stringify(existingReports));
      
      setSaveStatus('✅ Reporte mensual guardado correctamente');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('❌ Error al guardar el reporte: ' + error.message);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [reportType, selectedMonth, summary, setSaveStatus]);
  
  // Auto-save monthly reports when changing months
  useEffect(() => {
    if (reportType === 'monthly' && selectedMonth && fichajes.length > 0) {
      const timer = setTimeout(() => {
        saveMonthlyReport();
      }, 1000); // Wait a second after data loads before saving
      
      return () => clearTimeout(timer);
    }
  }, [reportType, selectedMonth, fichajes, saveMonthlyReport]);
  
  const exportToCSV = (data, summary) => {
    let csv = 'Fecha,Usuario,Entrada,Salida\n'
    summary.entries.forEach(entry => {
      csv += `${entry.date},${entry.user},${entry.entrada},${entry.salida}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fichajes_${reportType}_${currentUser?.username || currentUser?.nombre_completo || 'user'}_${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredData = filterFichajes()
  const summary = calculateSummary(filteredData)

  return (
    <div className="container">
      <h1 className="title">📊 Reportes de Fichaje</h1>
      
      <div className="form-group">
        <label>Tipo de Reporte:</label>
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            fontSize: '16px'
          }}
        >
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
        </select>
      </div>

      {reportType === 'weekly' && (
        <div className="form-group">
          <label>Semana:</label>
          <input
            type="text"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            placeholder="YYYY-MM-DD - YYYY-MM-DD"
            disabled={loading}
          />
        </div>
      )}

      {reportType === 'monthly' && (
        <div className="form-group">
          <label>Mes:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando datos...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <h3>Registro de Fichajes {reportType === 'weekly' ? 'Semanal' : 'Mensual'}</h3>

          {summary.entries && summary.entries.length > 0 ? (
            <div className="fichaje-entries">
              <div className="fichaje-header" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1.5fr 1fr 1fr', 
                fontWeight: 'bold',
                padding: '10px 0',
                borderBottom: '1px solid #ddd'
              }}>
                <span>Fecha</span>
                <span>Usuario</span>
                <span>Entrada</span>
                <span>Salida</span>
              </div>
              
              {summary.entries.map((entry, index) => (
                <div key={index} className="fichaje-entry" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1.5fr 1fr 1fr', 
                  padding: '12px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{entry.date}</span>
                  <span>{entry.user}</span>
                  <span style={{ color: '#28a745' }}>{entry.entrada}</span>
                  <span style={{ color: '#dc3545' }}>{entry.salida}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              No hay fichajes registrados para el período seleccionado.
            </div>
          )}
        </>
      )}

      {/* Show save button only for monthly reports */}
      {reportType === 'monthly' && (
        <button 
          onClick={saveMonthlyReport}
          className="secondary"
          disabled={!summary.entries || summary.entries.length === 0 || loading}
          style={{ marginTop: '20px' }}
        >
          💾 Guardar Reporte Mensual
        </button>
      )}
      
      <button 
        onClick={() => exportToCSV(filteredData, summary)}
        className="secondary"
        disabled={!summary.entries || summary.entries.length === 0 || loading}
        style={{ marginTop: '10px' }}
      >
        📥 Exportar a CSV
      </button>

      {saveStatus && (
        <div className={saveStatus.includes('✅') ? 'success' : 'error'} style={{ 
          marginTop: '15px', 
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center' 
        }}>
          {saveStatus}
        </div>
      )}

      <button 
        onClick={onBack}
        className="secondary"
        disabled={loading}
        style={{ marginTop: '10px' }}
      >
        ← Volver al Menú
      </button>
    </div>
  )
}

export default Reports
