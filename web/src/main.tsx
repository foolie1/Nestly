import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth'
import { MessagesProvider } from './messages'
import { LogsProvider } from './logs'
import { ThemeProvider } from './theme'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <MessagesProvider>
          <LogsProvider>
            <App />
          </LogsProvider>
        </MessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
