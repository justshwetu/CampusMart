import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Informational: API base is configured in AuthContext via VITE_API_BASE_URL or '/api'
window.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
console.log('API Base URL (window):', window.API_BASE_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>,
)
