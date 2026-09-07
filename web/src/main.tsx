import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth'
import { MessagesProvider } from './messages'
import { ThemeProvider } from './theme'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <MessagesProvider>
          <App />
        </MessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
