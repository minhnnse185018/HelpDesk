import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthRefreshProvider } from './context/AuthRefreshContext.jsx'
import { NotificationSocketProvider } from './context/NotificationSocketContext.jsx'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = '757803373730-qtfbvkdcst52e5nll337sl9asalkvh1r.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthRefreshProvider>
          <NotificationSocketProvider>
            <App />
          </NotificationSocketProvider>
        </AuthRefreshProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
