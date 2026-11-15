// postbuild.js — Copy static assets to dist after Vite build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dist = path.resolve(__dirname, 'dist');
const root = path.resolve(__dirname);

console.log('[postbuild] Copying static assets to dist...');

// 1. Copy fonts
const fontsSrc = path.resolve(root, 'assets', 'fonts');
const fontsDst = path.join(dist, 'assets', 'fonts');
if (fs.existsSync(fontsSrc)) {
  fs.mkdirSync(fontsDst, { recursive: true });
  for (const file of fs.readdirSync(fontsSrc)) {
    const src = path.join(fontsSrc, file);
    const dst = path.join(fontsDst, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dst);
      console.log(`  font: ${file}`);
    }
  }
}

// 2. Copy icons
const iconsSrc = path.resolve(root, 'assets', 'icons');
const iconsDst = path.join(dist, 'icons');
if (fs.existsSync(iconsSrc)) {
  fs.mkdirSync(iconsDst, { recursive: true });
  for (const file of fs.readdirSync(iconsSrc)) {
    const src = path.join(iconsSrc, file);
    const dst = path.join(iconsDst, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dst);
      console.log(`  icon: ${file}`);
    }
  }
}

// 3. Copy public files (sw.js, manifest.json)
const publicSrc = path.resolve(root, 'client', 'public');
if (fs.existsSync(publicSrc)) {
  for (const file of fs.readdirSync(publicSrc)) {
    const src = path.join(publicSrc, file);
    const dst = path.join(dist, file);
    if (fs.statSync(src).isFile() && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
      console.log(`  public: ${file}`);
    }
  }
}

// 4. Copy styles.css for backward compat
const cssSrc = path.resolve(root, 'client', 'src', 'styles', 'main.css');
const cssDst = path.join(dist, 'styles.css');
if (fs.existsSync(cssSrc)) {
  fs.copyFileSync(cssSrc, cssDst);
  console.log('  styles.css');
}

// 5. Create favicon.svg if missing
const favicon = path.join(dist, 'favicon.svg');
if (!fs.existsSync(favicon)) {
  fs.writeFileSync(favicon, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="#08070b" stroke="#c9a84c" stroke-width="2"/>
</svg>`);
  console.log('  favicon.svg (default)');
}

// 6. Create manifest.json if missing  
const manifest = path.join(dist, 'manifest.json');
if (!fs.existsSync(manifest)) {
  fs.writeFileSync(manifest, JSON.stringify({
    name: "Aetheria · Forge de Héros",
    short_name: "Aetheria",
    start_url: "/",
    display: "standalone",
    background_color: "#08070b",
    theme_color: "#0d1b2a"
  }));
  console.log('  manifest.json (default)');
}

// 7. Create sw.js if missing
const sw = path.join(dist, 'sw.js');
if (!fs.existsSync(sw)) {
  fs.writeFileSync(sw, `// Aetheria Service Worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
`);
  console.log('  sw.js (default)');
}

console.log('[postbuild] Done!');