import './styles/main.css';
import { App } from './app.js';
import { API } from './api.js';
import { Avatar3D } from './avatar3d.js';
import { GAME_DATA } from './data.js';

// Make globally available for inline handlers
window.API = API;
window.Avatar3D = Avatar3D;
window.GAME_DATA = GAME_DATA;

// Expose OfflineAPI
import { OfflineAPI } from './api.js';
window.OfflineAPI = OfflineAPI;

// Initialize app when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.app = app; // For debugging
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'flex';
});

export { API, Avatar3D, GAME_DATA };