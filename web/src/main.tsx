import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth'
import { MessagesProvider } from './messages'
import { LogsProvider } from './logs'
import { RosterProvider } from './roster'
import { IncidentsProvider } from './incidents'
import { BillingProvider } from './billing'
import { FormsProvider } from './forms'
import { ToursProvider } from './tours'
import { ThemeProvider } from './theme'
import './index.css'

// LogsProvider reads the roster (to resolve a child id to a name and room), so
// it has to sit inside RosterProvider.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RosterProvider>
          <MessagesProvider>
            <LogsProvider>
              <IncidentsProvider>
                <BillingProvider>
                  <FormsProvider>
                    <ToursProvider>
                      <App />
                    </ToursProvider>
                  </FormsProvider>
                </BillingProvider>
              </IncidentsProvider>
            </LogsProvider>
          </MessagesProvider>
        </RosterProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
