import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { isEmployeeSurface } from './lib/appSurface'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      if (!isEmployeeSurface()) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter(name => name.startsWith('corextor-static-'))
              .map(name => caches.delete(name)),
          );
        }
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
    } catch {
      // Keep silent. The app must continue to work even if SW registration fails.
    }
  });
}
