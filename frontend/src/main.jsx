import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Legacy CSS
import './styles/main.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/modals.css'
import './styles/features-kelas.css'
import './styles/features-guru.css'
import './styles/features-extra.css'

// Custom Styles (Sass)
import './styles/global.scss'

import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
