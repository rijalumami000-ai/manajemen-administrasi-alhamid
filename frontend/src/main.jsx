import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import antdTheme from './config/theme'

// Ant Design Styles
import 'antd/dist/reset.css'

// Legacy CSS (akan di-migrate bertahap)
import './styles/main.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/modals.css'
import './styles/features-kelas.css'
import './styles/features-guru.css'
import './styles/features-extra.css'

// Custom Styles (Sass) - Di-load TERAKHIR agar bisa meng-override CSS lama
import './styles/global.scss'
import './styles/antd-theme.scss'

import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
