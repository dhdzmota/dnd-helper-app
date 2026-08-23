import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Si el arranque detectó un navegador demasiado viejo, ya dejó un mensaje
// explicando qué hacer: montar encima solo daría una pantalla rota.
if (!(window as unknown as { __navegadorIncompatible?: boolean }).__navegadorIncompatible) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// El service worker solo existe en la build desplegada: ni en desarrollo, ni en
// la versión de un único archivo, ni dentro de la app de Android, donde el
// contenedor ya sirve todo desde el propio APK.
const enAndroid = 'AndroidFicha' in window
if ('serviceWorker' in navigator && import.meta.env.PROD && !__SINGLE_FILE__ && !enAndroid) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
