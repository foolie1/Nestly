import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth'
import { MessagesProvider } from './messages'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <MessagesProvider>
        <App />
      </MessagesProvider>
    </AuthProvider>
  </React.StrictMode>,
)
