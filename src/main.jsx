import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, DemoTourProvider } from './context/index.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <DemoTourProvider>
        <App />
      </DemoTourProvider>
    </AuthProvider>
  </BrowserRouter>,
)
