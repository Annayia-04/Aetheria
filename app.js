/* ==========================================================================
   AETHERIA — Application Principale
   Logique de la Forge, Hall de Guilde, Persistance, Export, PWA
   ========================================================================== */

// ==========================================================================
// ÉTAT GLOBAL
// ==========================================================================
const state = {
  // Données du héros en cours d'édition
  hero: {
    name: '',
    guild: '',
    classKey: 'paladin',
    title: '',
    stats: { social: 3, speed: 3, channel: 3, chaos: 3 },
    ultimate: '',
    weakness: '',
    potion: '',
    appearance: {
      race: 'human',
      skin: 'peach',
      build: 'average',
      height: 'average',
      posture: 'straight',
      face: 'oval',
      eyes: 'amber',
      expression: 'determined',
      mark: 'none',
      facialHair: 'none',
      warpaint: 'none',
      hairStyle: 'crew',
      hairColor: 'darkbrown',
      hairHighlight: 'none',
      outfit: 'plate-gold',
      headgear: 'none',
      artifact: 'scroll',
      aura: 'gold',
      frame: 'classic',
      backdrop: 'fortress',
      lighting: 'natural',
      particles: 'sparkles'
    }
  },

  // Registre de guilde (persisté)
  guildRoster: [],

  // UI State
  currentView: 'forge',
  currentTab: 'identity',
  currentSubtab: 'body',
  currentFilter: 'all',
  searchQuery: '',

  // Settings
  settings: {
    sound: true,
    reducedMotion: false,
    autoSave: true
  },

  // Draft (brouillon non sauvegardé)
  draft: null,

  // Son
  audioCtx: null,
  soundEnabled: true
};

// ==========================================================================
// INITIALISATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

async function initApp() {
  // Charger les préférences
  loadSettings();

  // Charger le roster de guilde
  loadGuildRoster();

  // Charger le brouillon ou créer un nouveau héros
  loadDraftOrNew();

  // Initialiser l'audio
  initAudio();

  // Rendu initial
  renderAll();

  // Attacher les écouteurs d'événements
  attachEventListeners();

  // Enregistrer le Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      console.log('[SW] Enregistré');
    } catch (e) {
      console.log('[SW] Échec:', e);
    }
  }

  // Gestion de l'installation PWA
  setupPWAInstall();

  // Gestion du clavier
  setupKeyboardShortcuts();

  // Détection reduced motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  state.settings.reducedMotion = mq.matches;
  document.body.classList.toggle('reduce-motion', mq.matches);
  mq.addEventListener('change', e => {
    state.settings.reducedMotion = e.matches;
    document.body.classList.toggle('reduce-motion', e.matches);
  });

  console.log('Aetheria initialisée');
}

// ==========================================================================
// PERSISTANCE (localStorage)
// ==========================================================================
const STORAGE_KEYS = {
  roster: 'aetheria_guild_roster',
  draft: 'aetheria_draft_hero',
  settings: 'aetheria_settings'
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    if (saved) {
      state.settings = { ...state.settings, ...JSON.parse(saved) };
    }
  } catch (e) { console.warn('Erreur chargement settings:', e); }
  applySettings();
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  } catch (e) { console.warn('Erreur sauvegarde settings:', e); }
}

function applySettings() {
  state.soundEnabled = state.settings.sound;
  updateSoundButton();
}

function loadGuildRoster() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.roster);
    if (saved) {
      state.guildRoster = JSON.parse(saved);
    } else {
      // Premier lancement : roster par défaut
      state.guildRoster = [...GAME_DATA.DEFAULT_GUILD_ROSTER];
      saveGuildRoster();
    }
  } catch (e) {
    console.warn('Erreur chargement roster:', e);
    state.guildRoster = [...GAME_DATA.DEFAULT_GUILD_ROSTER];
  }
}

function saveGuildRoster() {
  try {
    localStorage.setItem(STORAGE_KEYS.roster, JSON.stringify(state.guildRoster));
  } catch (e) { console.warn('Erreur sauvegarde roster:', e); }
}

function loadDraftOrNew() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.draft);
    if (saved) {
      const draft = JSON.parse(saved);
      // Vérifier que le draft n'est pas trop vieux (7 jours)
      if (draft.timestamp && Date.now() - draft.timestamp < 7 * 24 * 60 * 60 * 1000) {
        state.hero = { ...state.hero, ...draft.hero };
        state.draft = draft;
        return;
      }
    }
  } catch (e) { console.warn('Erreur chargement draft:', e); }
  // Pas de draft valide -> nouveau héros
  createNewHero();
}

function saveDraft() {
  if (!state.settings.autoSave) return;
  try {
    const draft = {
      hero: { ...state.hero },
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
    state.draft = draft;
  } catch (e) { console.warn('Erreur sauvegarde draft:', e); }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEYS.draft);
    state.draft = null;
  } catch (e) { console.warn('Erreur suppression draft:', e); }
}

// ==========================================================================
// CRÉATION NOUVEAU HÉROS
// ==========================================================================
function createNewHero() {
  const defaults = GAME_DATA.CLASSES.paladin;
  state.hero = {
    name: '',
    guild: '',
    classKey: 'paladin',
    title: '',
    stats: { ...defaults.defaultStats },
    ultimate: '',
    weakness: '',
    potion: '',
    appearance: {
      race: 'human',
      skin: 'peach',
      build: 'average',
      height: 'average',
      posture: 'straight',
      face: 'oval',
      eyes: 'amber',
      expression: 'determined',
      mark: 'none',
      facialHair: 'none',
      warpaint: 'none',
      hairStyle: 'crew',
      hairColor: 'darkbrown',
      hairHighlight: 'none',
      outfit: defaults.outfitPreset,
      headgear: 'none',
      artifact: 'scroll',
      aura: 'gold',
      frame: 'classic',
      backdrop: 'fortress',
      lighting: 'natural',
      particles: 'sparkles'
    }
  };
  saveDraft();
  renderAll();
  showToast('Nouveau héros créé', 'i-sparkles');
}

// ==========================================================================
// RENDU GLOBAL
// ==========================================================================
function renderAll() {
  renderHeroCard();
  renderIdentityPanel();
  renderAppearancePanel();
  renderAttributesPanel();
  renderGrimoirePanel();
  renderGuildHall();
  updateCompletionBadges();
  updateNavigation();
}

// ==========================================================================
// CARTE DE HÉROS (Portraits gauche)
// ==========================================================================
function renderHeroCard() {
  const h = state.hero;
  const cls = GAME_DATA.CLASSES[h.classKey];

  // Nom
  document.getElementById('portrait-name').textContent = h.name || '—';
  document.getElementById('portrait-title').textContent = h.title || '—';
  document.getElementById('portrait-guild').textContent = h.guild || 'Sans guilde';
  document.getElementById('portrait-motto').textContent = h.classKey ? `« ${cls.spec} »` : '« Prêt à forger ta légende ? »';

  // Avatar principal
  const avatarSvg = avatarEngine.generate(h.appearance, h.classKey);
  document.getElementById('avatar-svg').innerHTML = avatarSvg;

  // Backdrop
  const backdropSvg = avatarEngine.generateBackdrop(h.appearance.backdrop, h.appearance.lighting, h.appearance.particles);
  document.getElementById('portrait-backdrop').innerHTML = backdropSvg;

  // Glow
  const glowEl = document.getElementById('portrait-glow');
  glowEl.style.background = cls.glow || cls.color;

  // Cadre (le cadre est dans le SVG de l'avatar via frame)
  document.getElementById('portrait-frame').style.border = 'none';

  // Radar
  drawRadarChart(h.stats);

  // Particules
  if (!state.settings.reducedMotion) {
    spawnParticles(h.appearance.particles);
  }
}

function updateStatDisplay(stat, value) {
  const percent = (value / 5) * 100;
  document.getElementById(`disp-stat-${stat}`).textContent = `${value}/5`;
  document.getElementById(`bar-stat-${stat}`).style.width = `${percent}%`;
}

function drawRadarChart(stats) {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 280;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const center = { x: size / 2, y: size / 2 };
  const maxRadius = 110;
  const axes = ['social', 'speed', 'channel', 'chaos'];
  const colors = {
    social: '#78aaff',
    speed: '#e4bf70',
    channel: '#4dc397',
    chaos: '#b389ff'
  };

  ctx.clearRect(0, 0, size, size);

  // Web
  ctx.strokeStyle = 'rgba(228,191,112,0.1)';
  ctx.lineWidth = 1;
  for (let r = 1; r <= 5; r++) {
    ctx.beginPath();
    axes.forEach((axis, i) => {
      const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
      const radius = (r / 5) * maxRadius;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(228,191,112,0.15)';
  axes.forEach((axis, i) => {
    const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(angle) * maxRadius, center.y + Math.sin(angle) * maxRadius);
    ctx.stroke();
  });

  // Labels axes
  ctx.font = '11px "Cinzel", serif';
  ctx.fillStyle = '#d6cdbf';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  axes.forEach((axis, i) => {
    const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    const radius = maxRadius + 20;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    const labels = { social: 'Mana Social', speed: 'Initiative', channel: 'Canal', chaos: 'Pivots' };
    ctx.fillText(labels[axis], x, y);
  });

  // Polygone des stats
  ctx.beginPath();
  axes.forEach((axis, i) => {
    const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    const value = stats[axis] / 5;
    const radius = value * maxRadius;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();

  // Fill
  const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, maxRadius);
  gradient.addColorStop(0, 'rgba(228,191,112,0.35)');
  gradient.addColorStop(1, 'rgba(228,191,112,0.05)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Stroke
  ctx.strokeStyle = '#e4bf70';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#e4bf70';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Points
  ctx.fillStyle = '#fff7dc';
  axes.forEach((axis, i) => {
    const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    const value = stats[axis] / 5;
    const radius = value * maxRadius;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8963e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Valeurs
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#e4bf70';
  axes.forEach((axis, i) => {
    const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    const value = stats[axis] / 5;
    const radius = value * maxRadius + 18;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    ctx.fillText(stats[axis], x, y);
  });
}

// ==========================================================================
// PANNEAU IDENTITÉ
// ==========================================================================
function renderIdentityPanel() {
  const h = state.hero;
  const cls = GAME_DATA.CLASSES[h.classKey];

  document.getElementById('hero-name').value = h.name;
  document.getElementById('hero-guild').value = h.guild;
  document.getElementById('hero-title').value = h.title;

  // Classes
  document.querySelectorAll('.class-card').forEach(card => {
    const ck = card.dataset.class;
    const isActive = ck === h.classKey;
    card.setAttribute('aria-checked', isActive);
    if (isActive) card.classList.add('is-active'); else card.classList.remove('is-active');
  });
}

// ==========================================================================
// PANNEAU APPARENCE
// ==========================================================================
function renderAppearancePanel() {
  const a = state.hero.appearance;

  // Sous-onglets
  renderSubtabs();

  // Grilles d'options
  renderRaceGrid();
  renderSkinGrid();
  renderBuildGrid();
  renderHeightGrid();
  renderPostureGrid();
  renderFaceGrid();
  renderEyeGrid();
  renderExpressionGrid();
  renderMarkGrid();
  renderFacialHairGrid();
  renderWarpaintGrid();
  renderHairstyleGrid();
  renderHairColorGrid();
  renderHairHighlightGrid();
  renderOutfitGrid();
  renderHeadgearGrid();
  renderArtifactGrid();
  renderAuraGrid();
  renderFrameGrid();
  renderBackdropGrid();
  renderLightingGrid();
  renderParticlesGrid();

  // Mettre à jour les valeurs affichées
  updateAppearanceLabels();
}

function renderSubtabs() {
  document.querySelectorAll('.subtab').forEach(btn => {
    const active = btn.dataset.subtab === state.currentSubtab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active);
  });
  document.querySelectorAll('.subpanel').forEach(panel => {
    const active = panel.id === `sub-${state.currentSubtab}`;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
}

function updateAppearanceLabels() {
  const a = state.hero.appearance;
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || id;
  const getSkinName = (id) => GAME_DATA.SKIN_TONES[id]?.name || id;
  const getHairColorName = (id) => GAME_DATA.HAIR_COLORS[id]?.name || id;
  const getHighlightName = (id) => GAME_DATA.HAIR_HIGHLIGHTS.find(h => h.id === id)?.name || 'Aucun';

  document.getElementById('val-race').textContent = getName(GAME_DATA.RACES, a.race);
  document.getElementById('val-skin').textContent = getSkinName(a.skin);
  document.getElementById('val-build').textContent = getName(GAME_DATA.BUILDS, a.build);
  document.getElementById('val-height').textContent = getName(GAME_DATA.HEIGHTS, a.height);
  document.getElementById('val-posture').textContent = getName(GAME_DATA.POSTURES, a.posture);
  document.getElementById('val-face').textContent = getName(GAME_DATA.FACE_SHAPES, a.face);
  document.getElementById('val-eyes').textContent = GAME_DATA.EYE_COLORS[a.eyes]?.name || a.eyes;
  document.getElementById('val-expression').textContent = getName(GAME_DATA.EXPRESSIONS, a.expression);
  document.getElementById('val-mark').textContent = getName(GAME_DATA.MARKS, a.mark);
  document.getElementById('val-facial-hair').textContent = getName(GAME_DATA.FACIAL_HAIR, a.facialHair);
  document.getElementById('val-warpaint').textContent = getName(GAME_DATA.WARPAINTS, a.warpaint);
  document.getElementById('val-hairstyle').textContent = getName(GAME_DATA.HAIRSTYLES, a.hairStyle);
  document.getElementById('val-hair-color').textContent = getHairColorName(a.hairColor);
  document.getElementById('val-hair-highlight').textContent = getHighlightName(a.hairHighlight);
  document.getElementById('val-outfit').textContent = getOutfitName(state.hero.classKey, a.outfit);
  document.getElementById('val-headgear').textContent = getName(GAME_DATA.HEADGEAR, a.headgear);
  document.getElementById('val-artifact').textContent = getName(GAME_DATA.ARTIFACTS, a.artifact);
  document.getElementById('val-aura').textContent = getName(GAME_DATA.AURAS, a.aura);
  document.getElementById('val-frame').textContent = getName(GAME_DATA.FRAMES, a.frame);
  document.getElementById('val-backdrop').textContent = getName(GAME_DATA.BACKDROPS, a.backdrop);
  document.getElementById('val-lighting').textContent = getName(GAME_DATA.LIGHTINGS, a.lighting);
  document.getElementById('val-particles').textContent = getName(GAME_DATA.PARTICLES, a.particles);
}

function getOutfitName(classKey, outfitId) {
  const outfits = GAME_DATA.OUTFITS[classKey] || [];
  return outfits.find(o => o.id === outfitId)?.name || outfitId;
}

// ---- Rendu des grilles ----

function createOptionButton(item, isActive, onClick, extraClass = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `option-card ${extraClass} ${isActive ? 'is-active' : ''}`;
  btn.setAttribute('role', 'radio');
  btn.setAttribute('aria-checked', isActive);
  btn.dataset.value = item.id;
  btn.addEventListener('click', () => onClick(item.id));
  return btn;
}

function createSwatchButton(item, isActive, onClick, colorProp = 'base') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `swatch-btn ${isActive ? 'is-active' : ''}`;
  btn.setAttribute('role', 'radio');
  btn.setAttribute('aria-checked', isActive);
  btn.setAttribute('aria-label', item.name);
  btn.dataset.value = item.id;
  btn.dataset.swatch = item.id;
  btn.style.setProperty('--swatch-color', item[colorProp] || item.base || item.color);
  if (item.id === 'none') btn.style.background = 'repeating-conic-gradient(from 45deg, var(--bg-deep) 0 10px, var(--bg-panel) 10px 20px)';
  else btn.style.background = item[colorProp] || item.base || item.color;
  btn.innerHTML = '<span class="swatch-dot"></span>';
  btn.addEventListener('click', () => onClick(item.id));
  return btn;
}

function renderRaceGrid() {
  const grid = document.getElementById('race-grid');
  const current = state.hero.appearance.race;
  grid.innerHTML = '';
  GAME_DATA.RACES.forEach(race => {
    const btn = createOptionButton(race, race.id === current, (id) => {
      state.hero.appearance.race = id;
      // Ajuster les options par défaut selon la race
      const r = GAME_DATA.RACES.find(x => x.id === id);
      if (r) {
        if (r.skinTones && !r.skinTones.includes(state.hero.appearance.skin)) {
          state.hero.appearance.skin = r.skinTones[0];
        }
        if (r.build) state.hero.appearance.build = r.build;
        if (r.height) state.hero.appearance.height = r.height;
        if (r.baseBody === 'elf') state.hero.appearance.face = 'oval';
      }
      renderAppearancePanel();
      renderHeroCard();
      saveDraft();
      playSound('equip');
    }, 'race-card');
    btn.innerHTML = `
      <svg viewBox="0 0 64 64" class="race-glyph"><use href="#i-${race.id === 'human' ? 'users' : race.id === 'elf' ? 'mask' : race.id === 'dwarf' ? 'hammer' : race.id === 'orc' ? 'shield' : race.id === 'tiefling' ? 'flame' : 'feather'}"/></svg>
      <span>${race.name}</span>
    `;
    grid.appendChild(btn);
  });
}

function renderSkinGrid() {
  const grid = document.getElementById('skin-grid');
  const current = state.hero.appearance.skin;
  const race = GAME_DATA.RACES.find(r => r.id === state.hero.appearance.race);
  const allowed = race?.skinTones || Object.keys(GAME_DATA.SKIN_TONES);
  grid.innerHTML = '';
  allowed.forEach(key => {
    const skin = GAME_DATA.SKIN_TONES[key];
    if (!skin) return;
    const btn = createSwatchButton({ id: key, name: skin.name, base: skin.base }, key === current, (id) => {
      state.hero.appearance.skin = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    grid.appendChild(btn);
  });
}

function renderBuildGrid() {
  const grid = document.getElementById('build-grid');
  const current = state.hero.appearance.build;
  grid.innerHTML = '';
  GAME_DATA.BUILDS.forEach(b => {
    const btn = createOptionButton(b, b.id === current, (id) => {
      state.hero.appearance.build = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = `<span>${b.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderHeightGrid() {
  const grid = document.getElementById('height-grid');
  const current = state.hero.appearance.height;
  grid.innerHTML = '';
  GAME_DATA.HEIGHTS.forEach(h => {
    const btn = createOptionButton(h, h.id === current, (id) => {
      state.hero.appearance.height = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = `<span>${h.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderPostureGrid() {
  const grid = document.getElementById('posture-grid');
  const current = state.hero.appearance.posture;
  grid.innerHTML = '';
  GAME_DATA.POSTURES.forEach(p => {
    const btn = createOptionButton(p, p.id === current, (id) => {
      state.hero.appearance.posture = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = `<span>${p.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderFaceGrid() {
  const grid = document.getElementById('face-grid');
  const current = state.hero.appearance.face;
  grid.innerHTML = '';
  GAME_DATA.FACE_SHAPES.forEach(f => {
    const btn = createOptionButton(f, f.id === current, (id) => {
      state.hero.appearance.face = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = `<span>${f.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderEyeGrid() {
  const grid = document.getElementById('eye-grid');
  const current = state.hero.appearance.eyes;
  grid.innerHTML = '';
  Object.entries(GAME_DATA.EYE_COLORS).forEach(([key, eye]) => {
    const btn = createSwatchButton({ id: key, name: eye.name, base: eye.iris }, key === current, (id) => {
      state.hero.appearance.eyes = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    }, 'iris');
    grid.appendChild(btn);
  });
}

function renderExpressionGrid() {
  const grid = document.getElementById('expression-grid');
  const current = state.hero.appearance.expression;
  grid.innerHTML = '';
  GAME_DATA.EXPRESSIONS.forEach(e => {
    const btn = createOptionButton(e, e.id === current, (id) => {
      state.hero.appearance.expression = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = `<span>${e.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderMarkGrid() {
  const grid = document.getElementById('mark-grid');
  const current = state.hero.appearance.mark;
  grid.innerHTML = '';
  GAME_DATA.MARKS.forEach(m => {
    const btn = createOptionButton(m, m.id === current, (id) => {
      state.hero.appearance.mark = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = m.svg ? `<div class="mark-preview">${m.svg}</div><span>${m.name}</span>` : `<span>${m.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderFacialHairGrid() {
  const grid = document.getElementById('facial-hair-grid');
  const current = state.hero.appearance.facialHair;
  grid.innerHTML = '';
  GAME_DATA.FACIAL_HAIR.forEach(f => {
    const btn = createOptionButton(f, f.id === current, (id) => {
      state.hero.appearance.facialHair = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = f.svg ? `<div class="fh-preview">${f.svg.replace(/currentColor/g, '#382820')}</div><span>${f.name}</span>` : `<span>${f.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderWarpaintGrid() {
  const grid = document.getElementById('warpaint-grid');
  const current = state.hero.appearance.warpaint;
  grid.innerHTML = '';
  GAME_DATA.WARPAINTS.forEach(w => {
    const btn = createOptionButton(w, w.id === current, (id) => {
      state.hero.appearance.warpaint = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = w.svg ? `<div class="wp-preview">${w.svg}</div><span>${w.name}</span>` : `<span>${w.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderHairstyleGrid() {
  const grid = document.getElementById('hairstyle-grid');
  const current = state.hero.appearance.hairStyle;
  grid.innerHTML = '';
  GAME_DATA.HAIRSTYLES.forEach(h => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `hair-thumb ${h.id === current ? 'is-active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', h.id === current);
    btn.dataset.value = h.id;
    btn.innerHTML = h.svg.replace(/currentColor/g, '#3d2818').replace(/fill="#[^"]*"/g, 'fill="#3d2818"');
    btn.addEventListener('click', () => {
      state.hero.appearance.hairStyle = h.id;
      renderAppearancePanel();
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    grid.appendChild(btn);
  });
}

function renderHairColorGrid() {
  const grid = document.getElementById('hair-color-grid');
  const current = state.hero.appearance.hairColor;
  grid.innerHTML = '';
  Object.entries(GAME_DATA.HAIR_COLORS).forEach(([key, hc]) => {
    const btn = createSwatchButton({ id: key, name: hc.name, base: hc.base }, key === current, (id) => {
      state.hero.appearance.hairColor = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    grid.appendChild(btn);
  });
}

function renderHairHighlightGrid() {
  const grid = document.getElementById('hair-highlight-grid');
  const current = state.hero.appearance.hairHighlight;
  grid.innerHTML = '';
  GAME_DATA.HAIR_HIGHLIGHTS.forEach(h => {
    const btn = createSwatchButton(h, h.id === current, (id) => {
      state.hero.appearance.hairHighlight = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    }, 'color');
    grid.appendChild(btn);
  });
}

function renderOutfitGrid() {
  const grid = document.getElementById('outfit-grid');
  const current = state.hero.appearance.outfit;
  const outfits = GAME_DATA.OUTFITS[state.hero.classKey] || [];
  grid.innerHTML = '';
  outfits.forEach(o => {
    const btn = createOptionButton(o, o.id === current, (id) => {
      state.hero.appearance.outfit = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    }, 'outfit-card');
    // SVG simplifié pour l'aperçu
    const previewSvg = getOutfitPreviewSVG(state.hero.classKey, o.id);
    btn.innerHTML = `${previewSvg}<div><span class="outfit-name">${o.name}</span></div>`;
    grid.appendChild(btn);
  });
}

function getOutfitPreviewSVG(classKey, outfitId) {
  const previews = {
    paladin: { 'plate-gold': '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="28" rx="18" ry="14" fill="#c8c8d0" stroke="#e4bf70" stroke-width="2"/><ellipse cx="32" cy="28" rx="12" ry="8" fill="#e4bf70" opacity=".3"/></svg>' },
    ranger: { 'leather-green': '<svg viewBox="0 0 64 64"><path d="M12 20 L20 12 L44 12 L52 20 L52 52 L12 52 Z" fill="#382818" stroke="#181008" stroke-width="1.5"/></svg>' },
    bard: { 'velvet-red': '<svg viewBox="0 0 64 64"><path d="M12 20 L20 12 L44 12 L52 20 L52 52 L12 52 Z" fill="#b83030" stroke="#e4bf70" stroke-width="1.5"/></svg>' },
    alchemist: { 'apron-leather': '<svg viewBox="0 0 64 64"><path d="M12 20 L20 12 L44 12 L52 20 L52 52 L12 52 Z" fill="#182028" stroke="#283040" stroke-width="1.5"/><rect x="18" y="30" width="28" height="10" fill="#382818" stroke="#181008" stroke-width="1"/></svg>' }
  };
  return previews[classKey]?.[outfitId] || '<svg viewBox="0 0 64 64"><rect x="12" y="12" width="40" height="40" fill="#383848"/></svg>';
}

function renderHeadgearGrid() {
  const grid = document.getElementById('headgear-grid');
  const current = state.hero.appearance.headgear;
  grid.innerHTML = '';
  GAME_DATA.HEADGEAR.forEach(h => {
    const btn = createOptionButton(h, h.id === current, (id) => {
      state.hero.appearance.headgear = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = h.svg ? `<div class="hg-preview">${h.svg}</div><span>${h.name}</span>` : `<span>${h.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderArtifactGrid() {
  const grid = document.getElementById('artifact-grid');
  const current = state.hero.appearance.artifact;
  grid.innerHTML = '';
  GAME_DATA.ARTIFACTS.forEach(a => {
    const btn = createOptionButton(a, a.id === current, (id) => {
      state.hero.appearance.artifact = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = a.svg ? `<div class="art-preview">${a.svg.replace(/#e4bf70|#f59e0b|#f5d99e/g, 'currentColor').replace(/#b45309|#ca8a04/g, 'currentColor').replace(/#38bdf8|#06b6d4/g, 'currentColor').replace(/#4ade80|#22c55e/g, 'currentColor').replace(/#a855f7|#b389ff/g, 'currentColor').replace(/#e86020|#ef4444/g, 'currentColor')}</div><span>${a.name}</span>` : `<span>${a.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderAuraGrid() {
  const grid = document.getElementById('aura-grid');
  const current = state.hero.appearance.aura;
  grid.innerHTML = '';
  GAME_DATA.AURAS.forEach(a => {
    const btn = createOptionButton(a, a.id === current, (id) => {
      state.hero.appearance.aura = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    }, 'aura-card');
    btn.innerHTML = a.svg ? `<div class="aura-preview">${a.svg.replace(/#e4bf70|#a88cff|#5cdbe2|#65c29a|#f59e0b|#584068|#b83030|#70c0e8|#e0d040|#f8f0d0/g, 'currentColor')}</div><span>${a.name}</span>` : `<span>${a.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderFrameGrid() {
  const grid = document.getElementById('frame-grid');
  const current = state.hero.appearance.frame;
  grid.innerHTML = '';
  GAME_DATA.FRAMES.forEach(f => {
    const btn = createOptionButton(f, f.id === current, (id) => {
      state.hero.appearance.frame = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    }, 'frame-card');
    btn.innerHTML = f.svg ? `<div class="frame-preview">${f.svg}</div><span>${f.name}</span>` : `<span>${f.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderBackdropGrid() {
  const grid = document.getElementById('backdrop-grid');
  const current = state.hero.appearance.backdrop;
  grid.innerHTML = '';
  GAME_DATA.BACKDROPS.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `backdrop-thumb ${b.id === current ? 'is-active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', b.id === current);
    btn.dataset.value = b.id;
    btn.innerHTML = b.svg || '<rect width="100%" height="100%" fill="#181820"/>';
    btn.addEventListener('click', () => {
      state.hero.appearance.backdrop = b.id;
      renderAppearancePanel();
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    grid.appendChild(btn);
  });
}

function renderLightingGrid() {
  const grid = document.getElementById('lighting-grid');
  const current = state.hero.appearance.lighting;
  grid.innerHTML = '';
  GAME_DATA.LIGHTINGS.forEach(l => {
    const btn = createOptionButton(l, l.id === current, (id) => {
      state.hero.appearance.lighting = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = `<span>${l.name}</span>`;
    grid.appendChild(btn);
  });
}

function renderParticlesGrid() {
  const grid = document.getElementById('particles-grid');
  const current = state.hero.appearance.particles;
  grid.innerHTML = '';
  GAME_DATA.PARTICLES.forEach(p => {
    const btn = createOptionButton(p, p.id === current, (id) => {
      state.hero.appearance.particles = id;
      renderHeroCard();
      saveDraft();
      playSound('equip');
    });
    btn.innerHTML = p.svg ? `<div class="part-preview">${p.svg}</div><span>${p.name}</span>` : `<span>${p.name}</span>`;
    grid.appendChild(btn);
  });
}

// ==========================================================================
// PANNEAU ATTRIBUTS
// ==========================================================================
function renderAttributesPanel() {
  const h = state.hero;
  const stats = h.stats;

  ['social', 'speed', 'channel', 'chaos'].forEach(stat => {
    const val = stats[stat];
    document.getElementById(`stat-${stat}`).value = val;
    document.querySelector(`#stat-${stat} + .stat-value`).textContent = val;
    document.getElementById(`desc-${stat}`).textContent = GAME_DATA.STAT_TEXTS[stat][val] || '';
  });

  drawRadarChart(stats);
}

// ==========================================================================
// PANNEAU GRIMOIRE
// ==========================================================================
function renderGrimoirePanel() {
  const h = state.hero;

  document.getElementById('grimoire-ultimate').value = h.ultimate;
  document.getElementById('grimoire-weakness').value = h.weakness;
  document.getElementById('grimoire-potion').value = h.potion;

  updateMarkdownPreview();
}

function updateMarkdownPreview() {
  const h = state.hero;
  const cls = GAME_DATA.CLASSES[h.classKey];
  const lines = [
    `## ${h.name || '—'}`,
    `**${h.title || '—'}** • ${cls?.name || '—'} • ${h.guild || 'Sans guilde'}`,
    '',
    '### ⚔️ Attributs',
    `| Mana Social | Initiative | Canal | Pivots |`,
    `|:---:|:---:|:---:|:---:|`,
    `| ${h.stats.social}/5 | ${h.stats.speed}/5 | ${h.stats.channel}/5 | ${h.stats.chaos}/5 |`,
    '',
    '### 📜 Grimoire',
    `**Don Ultime :** ${h.ultimate || '—'}`,
    `**Kryptonite :** ${h.weakness || '—'}`,
    `**Potion :** ${h.potion || '—'}`,
    '',
    `*Forgé dans la Forge d'Aetheria*`
  ];
  document.getElementById('markdown-preview').textContent = lines.join('\n');
}

// ==========================================================================
// HALL DE GUILDE
// ==========================================================================
function renderGuildHall() {
  const grid = document.getElementById('guild-grid');
  const empty = document.getElementById('empty-state');
  const filter = state.currentFilter;
  const query = state.searchQuery.toLowerCase();

  let roster = state.guildRoster;

  // Filtre classe
  if (filter !== 'all') {
    if (filter === 'legends') {
      roster = roster.filter(h => h.isLegend);
    } else {
      roster = roster.filter(h => h.classKey === filter);
    }
  }

  // Recherche
  if (query) {
    roster = roster.filter(h =>
      h.name.toLowerCase().includes(query) ||
      h.guild.toLowerCase().includes(query) ||
      h.classKey.includes(query) ||
      h.title.toLowerCase().includes(query)
    );
  }

  if (roster.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  grid.innerHTML = '';

  roster.forEach(hero => {
    const card = createGuildCard(hero);
    grid.appendChild(card);
  });

  // Carte "Nouveau"
  if (!query && filter === 'all') {
    const addCard = document.createElement('button');
    addCard.type = 'button';
    addCard.className = 'guild-add-card';
    addCard.setAttribute('role', 'listitem');
    addCard.innerHTML = `
      <div class="guild-add-icon"><svg><use href="#i-plus"/></svg></div>
      <strong>Forger un nouvel aventurier</strong>
      <span>Une fiche de plus, une devinette de moins pour ton équipe.</span>
    `;
    addCard.addEventListener('click', () => {
      setView('forge');
      createNewHero();
    });
    grid.appendChild(addCard);
  }
}

function createGuildCard(hero) {
  const cls = GAME_DATA.CLASSES[hero.classKey];
  const card = document.createElement('article');
  card.className = `guild-card ${hero.isLegend ? 'legend' : ''}`;
  card.setAttribute('role', 'listitem');
  card.dataset.id = hero.id;

  // Avatar miniature
  const thumbSvg = avatarEngine.generateThumb(hero.appearance, hero.classKey);

  card.innerHTML = `
    <div class="guild-portrait">
      ${thumbSvg}
    </div>
    <div class="guild-card-body">
      <header class="guild-card-head">
        <h3 class="guild-card-name">${escapeHtml(hero.name)}</h3>
        <span class="guild-class-pill" style="--class-color:${cls.color}">
          <svg><use href="#${cls.icon}"/></svg> ${cls.name}
        </span>
      </header>
      <p class="guild-card-title">${escapeHtml(hero.title)}</p>
      <p class="guild-card-guild">${escapeHtml(hero.guild)}</p>
      <div class="guild-stats">
        <div class="guild-stat"><strong style="--stat-color:#78aaff">${hero.stats.social}</strong><span>Social</span></div>
        <div class="guild-stat"><strong style="--stat-color:#e4bf70">${hero.stats.speed}</strong><span>Init.</span></div>
        <div class="guild-stat"><strong style="--stat-color:#4dc397">${hero.stats.channel}</strong><span>Canal</span></div>
        <div class="guild-stat"><strong style="--stat-color:#b389ff">${hero.stats.chaos}</strong><span>Pivots</span></div>
      </div>
      <div class="guild-spells">
        <div class="guild-spell guild-spell--sun"><svg><use href="#i-sun"/></svg><span><strong>Don :</strong> ${escapeHtml(hero.ultimate)}</span></div>
        <div class="guild-spell guild-spell--skull"><svg><use href="#i-skull"/></svg><span><strong>Kryptonite :</strong> ${escapeHtml(hero.weakness)}</span></div>
        <div class="guild-spell guild-spell--potion"><svg><use href="#i-flask"/></svg><span><strong>Potion :</strong> ${escapeHtml(hero.potion)}</span></div>
      </div>
      <footer class="guild-footer-meta">
        <span><svg><use href="#i-award"/></svg> ${hero.isLegend ? 'Légende' : 'Aventurier'}</span>
        <span>ID: ${hero.id}</span>
      </footer>
      <div class="guild-actions">
        <button class="guild-action" data-action="edit" title="Charger dans la forge" aria-label="Modifier ${escapeHtml(hero.name)}"><svg><use href="#i-edit"/></svg></button>
        <button class="guild-action" data-action="duplicate" title="Dupliquer" aria-label="Dupliquer ${escapeHtml(hero.name)}"><svg><use href="#i-copy"/></svg></button>
        <button class="guild-action" data-action="share" title="Partager" aria-label="Partager ${escapeHtml(hero.name)}"><svg><use href="#i-share"/></svg></button>
        ${!hero.isLegend ? `<button class="guild-action is-danger" data-action="delete" title="Retirer du registre" aria-label="Retirer ${escapeHtml(hero.name)}"><svg><use href="#i-trash"/></svg></button>` : ''}
      </div>
    </div>
  `;

  // Actions
  card.querySelector('[data-action="edit"]').addEventListener('click', () => loadHeroToForge(hero));
  card.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateHero(hero));
  card.querySelector('[data-action="share"]').addEventListener('click', () => shareHero(hero));
  const delBtn = card.querySelector('[data-action="delete"]');
  if (delBtn) delBtn.addEventListener('click', () => confirmDeleteHero(hero));

  // Clic sur la carte -> modal détail
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.guild-action')) openHeroModal(hero);
  });

  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================================================
// ACTIONS HÉROS
// ==========================================================================
function loadHeroToForge(hero) {
  state.hero = { ...hero };
  // S'assurer que appearance est complet
  state.hero.appearance = { ...GAME_DATA.CLASSES[hero.classKey]?.appearanceDefaults, ...hero.appearance };
  setView('forge');
  renderAll();
  showToast(`${hero.name} chargé dans la forge`, 'i-hammer');
  playSound('equip');
}

function duplicateHero(hero) {
  const newHero = {
    ...hero,
    id: 'hero-' + Date.now(),
    name: hero.name + ' (Copie)',
    isLegend: false
  };
  state.guildRoster.unshift(newHero);
  saveGuildRoster();
  renderGuildHall();
  showToast(`${hero.name} dupliqué`, 'i-copy');
  playSound('click');
}

async function shareHero(hero) {
  const markdown = generateMarkdown(hero);
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${hero.name} — Fiche d'Aventurier`,
        text: markdown
      });
      showToast('Partagé !', 'i-share');
    } catch (e) {
      if (e.name !== 'AbortError') fallbackCopy(markdown);
    }
  } else {
    fallbackCopy(markdown);
  }
}

function fallbackCopy(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copié dans le presse-papiers', 'i-copy');
  }).catch(() => {
    showToast('Échec de la copie', 'i-trash', true);
  });
}

function confirmDeleteHero(hero) {
  openConfirmModal(
    `Retirer ${hero.name} du registre ?`,
    'Cette action est irréversible.',
    () => deleteHero(hero.id)
  );
}

function deleteHero(id) {
  state.guildRoster = state.guildRoster.filter(h => h.id !== id);
  saveGuildRoster();
  renderGuildHall();
  showToast('Héros retiré du registre', 'i-trash');
  playSound('click');
}

// ==========================================================================
// MODAL DÉTAIL HÉROS
// ==========================================================================
function openHeroModal(hero) {
  const modal = document.getElementById('modal-hero');
  const cls = GAME_DATA.CLASSES[hero.classKey];

  // Visuel
  const visualSvg = avatarEngine.generate(hero.appearance, hero.classKey);
  document.getElementById('hero-modal-visual').innerHTML = visualSvg;

  // Infos
  document.getElementById('hero-modal-title').textContent = hero.name;
  document.getElementById('hero-modal-sub').textContent = `${hero.title} • ${cls.name} • ${hero.guild}`;

  // Stats
  const statsHtml = Object.entries(hero.stats).map(([stat, val]) => {
    const colors = { social: '#78aaff', speed: '#e4bf70', channel: '#4dc397', chaos: '#b389ff' };
    const labels = { social: 'Mana Social', speed: 'Initiative', channel: 'Canal', chaos: 'Pivots' };
    return `<div class="hero-modal-stat"><strong style="--stat-color:${colors[stat]}">${val}</strong><span>${labels[stat]}</span></div>`;
  }).join('');
  document.getElementById('hero-modal-stats').innerHTML = statsHtml;

  // Sorts
  document.getElementById('hero-modal-spells').innerHTML = `
    <div class="guild-spell guild-spell--sun"><svg><use href="#i-sun"/></svg><span><strong>Don :</strong> ${escapeHtml(hero.ultimate)}</span></div>
    <div class="guild-spell guild-spell--skull"><svg><use href="#i-skull"/></svg><span><strong>Kryptonite :</strong> ${escapeHtml(hero.weakness)}</span></div>
    <div class="guild-spell guild-spell--potion"><svg><use href="#i-flask"/></svg><span><strong>Potion :</strong> ${escapeHtml(hero.potion)}</span></div>
  `;

  // Actions
  const actions = document.getElementById('hero-modal-actions');
  actions.innerHTML = `
    <button class="btn btn-primary" onclick="loadHeroToForge(${JSON.stringify(hero).replace(/"/g, '"')}); closeModal('modal-hero')"><svg><use href="#i-edit"/></svg> Charger dans la Forge</button>
    <button class="btn btn-quiet" onclick="duplicateHero(${JSON.stringify(hero).replace(/"/g, '"')}); closeModal('modal-hero')"><svg><use href="#i-copy"/></svg> Dupliquer</button>
    <button class="btn btn-quiet" onclick="shareHero(${JSON.stringify(hero).replace(/"/g, '"')}); closeModal('modal-hero')"><svg><use href="#i-share"/></svg> Partager</button>
    ${!hero.isLegend ? `<button class="btn btn-danger" onclick="confirmDeleteHero(${JSON.stringify(hero).replace(/"/g, '"')}); closeModal('modal-hero')"><svg><use href="#i-trash"/></svg> Retirer</button>` : ''}
  `;

  modal.showModal();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.close();
}

function openConfirmModal(title, text, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-ok').onclick = () => {
    onConfirm();
    modal.close();
  };
  document.getElementById('confirm-cancel').onclick = () => modal.close();
  modal.showModal();
}

// ==========================================================================
// EXPORT PNG
// ==========================================================================
async function exportPNG() {
  const btn = document.getElementById('btn-export-png');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg class="spinning" style="animation:spin 1s linear infinite"><use href="#i-download"/></svg> Génération...';

  try {
    const h = state.hero;
    const cls = GAME_DATA.CLASSES[h.classKey];

    // Créer un canvas haute résolution (1080x1440 pour ratio 3:4)
    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    // Fond
    ctx.fillStyle = '#08070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texture
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 5000; i++) {
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
    ctx.restore();

    // Carte principale (centrée)
    const cardW = 900;
    const cardH = 1200;
    const cardX = (canvas.width - cardW) / 2;
    const cardY = (canvas.height - cardH) / 2;

    // Cadre doré
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 6;
    ctx.strokeRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6);
    ctx.strokeStyle = '#e4bf70';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX + 8, cardY + 8, cardW - 16, cardH - 16);

    // Backdrop
    const backdropSvg = avatarEngine.generateBackdrop(h.appearance.backdrop, h.appearance.lighting, h.appearance.particles);
    await drawSvgOnCanvas(ctx, backdropSvg, cardX + 20, cardY + 20, cardW - 40, cardH - 200, 0.6);

    // Avatar
    const avatarSvg = avatarEngine.generate(h.appearance, h.classKey);
    await drawSvgOnCanvas(ctx, avatarSvg, cardX + 80, cardY + 80, cardW - 160, (cardW - 160) * 1.2);

    // Cadre de portrait
    const frameSvg = avatarEngine.generateFrame(h.appearance.frame);
    await drawSvgOnCanvas(ctx, frameSvg, cardX + 80, cardY + 80, cardW - 160, (cardW - 160) * 1.2);

    // Textes
    ctx.font = 'bold 48px "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = '#e4bf70';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#e4bf70';
    ctx.shadowBlur = 10;
    ctx.fillText(h.name || 'Sans Nom', canvas.width / 2, cardY + cardH - 280);
    ctx.shadowBlur = 0;

    ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#d6cdbf';
    ctx.fillText(h.title || 'Sans Titre', canvas.width / 2, cardY + cardH - 230);

    ctx.font = '16px "Cinzel", serif';
    ctx.fillStyle = '#9f9588';
    ctx.fillText(h.guild || 'Sans Guilde', canvas.width / 2, cardY + cardH - 190);

    // Classe
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = cls.color;
    ctx.fillText(cls.name.toUpperCase(), canvas.width / 2, cardY + cardH - 150);

    // Stats
    const statY = cardY + cardH - 110;
    const statW = cardW / 4 - 20;
    ['social', 'speed', 'channel', 'chaos'].forEach((stat, i) => {
      const x = cardX + 30 + i * (statW + 20) + statW / 2;
      const colors = { social: '#78aaff', speed: '#e4bf70', channel: '#4dc397', chaos: '#b389ff' };
      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.fillStyle = colors[stat];
      ctx.fillText(h.stats[stat], x, statY);
      ctx.font = '12px "Cinzel", serif';
      ctx.fillStyle = '#756c61';
      ctx.fillText(stat.toUpperCase(), x, statY + 22);
    });

    // Grimoire
    const grimoireY = cardY + cardH - 40;
    ctx.font = 'bold 18px "Cinzel", serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('DON: ' + (h.ultimate || '—'), canvas.width / 2, grimoireY - 30);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('KRYPTONITE: ' + (h.weakness || '—'), canvas.width / 2, grimoireY);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('POTION: ' + (h.potion || '—'), canvas.width / 2, grimoireY + 30);

    // Filigrane
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a4538';
    ctx.textAlign = 'left';
    ctx.fillText('Aetheria — Forge de Héros', cardX + 20, canvas.height - 20);
    ctx.textAlign = 'right';
    ctx.fillText('aetheria.app', canvas.width - 20, canvas.height - 20);

    // Télécharger
    const link = document.createElement('a');
    link.download = `${(h.name || 'aventurier').replace(/\s+/g, '_')}_aetheria.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Carte PNG exportée !', 'i-image');
    playSound('fanfare');
  } catch (e) {
    console.error('Erreur export PNG:', e);
    showToast('Erreur lors de l\'export', 'i-trash', true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function drawSvgOnCanvas(ctx, svgString, x, y, w, h, opacity = 1) {
  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}

// ==========================================================================
// COPIE MARKDOWN
// ==========================================================================
function copyMarkdown() {
  const markdown = generateMarkdown(state.hero);
  navigator.clipboard.writeText(markdown).then(() => {
    showToast('Markdown copié !', 'i-copy');
    playSound('click');
  }).catch(() => {
    showToast('Échec de la copie', 'i-trash', true);
  });
}

function generateMarkdown(hero) {
  const cls = GAME_DATA.CLASSES[hero.classKey];
  return `## ${hero.name || '—'}
**${hero.title || '—'}** • ${cls?.name || '—'} • ${hero.guild || 'Sans guilde'}

### ⚔️ Attributs
| Mana Social | Initiative | Canal | Pivots |
|:---:|:---:|:---:|:---:|
| ${hero.stats.social}/5 | ${hero.stats.speed}/5 | ${hero.stats.channel}/5 | ${hero.stats.chaos}/5 |

### 📜 Grimoire
**Don Ultime :** ${hero.ultimate || '—'}
**Kryptonite :** ${hero.weakness || '—'}
**Potion :** ${hero.potion || '—'}

---
*Forgé dans la Forge d'Aetheria*`;
}

// ==========================================================================
// DÉ DU DESTIN (Randomizer)
// ==========================================================================
function rollFateDice() {
  playSound('diceRoll');

  // Animation visuelle
  const diceBtn = document.getElementById('btn-dice-bottom');
  const diceTop = document.getElementById('btn-roll-dice');
  [diceBtn, diceTop].forEach(btn => {
    if (btn) {
      btn.classList.add('rolling');
      setTimeout(() => btn.classList.remove('rolling'), 800);
    }
  });

  // Aléatoire complet
  const races = GAME_DATA.RACES.map(r => r.id);
  const race = races[Math.floor(Math.random() * races.length)];
  const raceData = GAME_DATA.RACES.find(r => r.id === race);

  const skins = raceData?.skinTones || Object.keys(GAME_DATA.SKIN_TONES);
  const skin = skins[Math.floor(Math.random() * skins.length)];

  const builds = GAME_DATA.BUILDS.map(b => b.id);
  const build = builds[Math.floor(Math.random() * builds.length)];

  const heights = GAME_DATA.HEIGHTS.map(h => h.id);
  const height = heights[Math.floor(Math.random() * heights.length)];

  const postures = GAME_DATA.POSTURES.map(p => p.id);
  const posture = postures[Math.floor(Math.random() * postures.length)];

  const faces = GAME_DATA.FACE_SHAPES.map(f => f.id);
  const face = faces[Math.floor(Math.random() * faces.length)];

  const eyes = Object.keys(GAME_DATA.EYE_COLORS);
  const eye = eyes[Math.floor(Math.random() * eyes.length)];

  const expressions = GAME_DATA.EXPRESSIONS.map(e => e.id);
  const expression = expressions[Math.floor(Math.random() * expressions.length)];

  const marks = GAME_DATA.MARKS.map(m => m.id);
  const mark = marks[Math.floor(Math.random() * marks.length)];

  const facialHairs = GAME_DATA.FACIAL_HAIR.map(f => f.id);
  const facialHair = facialHairs[Math.floor(Math.random() * facialHairs.length)];

  const warpaints = GAME_DATA.WARPAINTS.map(w => w.id);
  const warpaint = warpaints[Math.floor(Math.random() * warpaints.length)];

  const hairStyles = GAME_DATA.HAIRSTYLES.map(h => h.id);
  const hairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];

  const hairColors = Object.keys(GAME_DATA.HAIR_COLORS);
  const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];

  const hairHighlights = GAME_DATA.HAIR_HIGHLIGHTS.map(h => h.id);
  const hairHighlight = hairHighlights[Math.floor(Math.random() * hairHighlights.length)];

  const outfits = GAME_DATA.OUTFITS[state.hero.classKey] || [];
  const outfit = outfits[Math.floor(Math.random() * outfits.length)]?.id || 'plate-gold';

  const headgears = GAME_DATA.HEADGEAR.map(h => h.id);
  const headgear = headgears[Math.floor(Math.random() * headgears.length)];

  const artifacts = GAME_DATA.ARTIFACTS.map(a => a.id);
  const artifact = artifacts[Math.floor(Math.random() * artifacts.length)];

  const auras = GAME_DATA.AURAS.map(a => a.id);
  const aura = auras[Math.floor(Math.random() * auras.length)];

  const frames = GAME_DATA.FRAMES.map(f => f.id);
  const frame = frames[Math.floor(Math.random() * frames.length)];

  const backdrops = GAME_DATA.BACKDROPS.map(b => b.id);
  const backdrop = backdrops[Math.floor(Math.random() * backdrops.length)];

  const lightings = GAME_DATA.LIGHTINGS.map(l => l.id);
  const lighting = lightings[Math.floor(Math.random() * lightings.length)];

  const particles = GAME_DATA.PARTICLES.map(p => p.id);
  const particle = particles[Math.floor(Math.random() * particles.length)];

  // Appliquer
  state.hero.appearance = {
    race, skin, build, height, posture,
    face, eyes, expression, mark, facialHair, warpaint,
    hairStyle, hairColor, hairHighlight,
    outfit, headgear, artifact, aura, frame,
    backdrop, lighting, particles: particle
  };

  // Stats aléatoires
  state.hero.stats = {
    social: Math.floor(Math.random() * 5) + 1,
    speed: Math.floor(Math.random() * 5) + 1,
    channel: Math.floor(Math.random() * 5) + 1,
    chaos: Math.floor(Math.random() * 5) + 1
  };

  // Grimoire aléatoire
  const snippets = GAME_DATA.GRIMOIRE_SNIPPETS;
  state.hero.ultimate = snippets.ultimate[Math.floor(Math.random() * snippets.ultimate.length)].text;
  state.hero.weakness = snippets.weakness[Math.floor(Math.random() * snippets.weakness.length)].text;
  state.hero.potion = snippets.potion[Math.floor(Math.random() * snippets.potion.length)].text;

  // Classe aléatoire
  const classes = Object.keys(GAME_DATA.CLASSES);
  state.hero.classKey = classes[Math.floor(Math.random() * classes.length)];

  renderAll();
  showToast('Le Dé du Destin a parlé !', 'i-dice');
  saveDraft();
}

function randomizeAppearance() {
  // Juste l'apparence, pas les stats
  const oldClass = state.hero.classKey;
  rollFateDice();
  state.hero.classKey = oldClass;
  // Réappliquer l'outfit de la classe
  const cls = GAME_DATA.CLASSES[oldClass];
  state.hero.appearance.outfit = cls.outfitPreset;
  renderAll();
  saveDraft();
}

// ==========================================================================
// PROFIL DE CLASSE (Appliquer les défauts de la classe)
// ==========================================================================
function applyClassPreset() {
  const cls = GAME_DATA.CLASSES[state.hero.classKey];
  if (!cls) return;

  // Stats
  state.hero.stats = { ...cls.defaultStats };

  // Apparence par défaut
  state.hero.appearance = {
    ...state.hero.appearance,
    race: cls.bodyType || 'human',
    build: cls.build || 'average',
    height: cls.height || 'average',
    outfit: cls.outfitPreset,
    aura: cls.id === 'paladin' ? 'gold' : cls.id === 'ranger' ? 'emerald' : cls.id === 'bard' ? 'violet' : 'cyan',
    frame: cls.id === 'paladin' ? 'classic' : cls.id === 'ranger' ? 'nature' : cls.id === 'bard' ? 'ornate' : 'runic'
  };

  renderAll();
  showToast(`Profil ${cls.name} appliqué`, 'i-sparkles');
  playSound('equip');
  saveDraft();
}

// ==========================================================================
// SAUVEGARDE / INSCRIPTION
// ==========================================================================
function saveHero() {
  const h = state.hero;

  // Validation
  if (!h.name.trim()) {
    showToast('Donne un nom à ton héros !', 'i-skull', true);
    document.getElementById('hero-name').focus();
    return;
  }
  if (!h.classKey) {
    showToast('Choisis une classe !', 'i-skull', true);
    return;
  }

  // Vérifier si déjà dans le roster (édition)
  const existingIndex = state.guildRoster.findIndex(r => r.id === h.id);
  const isNew = existingIndex === -1;

  const heroData = {
    ...h,
    id: h.id || 'hero-' + Date.now(),
    isLegend: false,
    createdAt: h.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (isNew) {
    state.guildRoster.unshift(heroData);
    showToast(`${h.name} inscrit au registre !`, 'i-save');
    playSound('fanfare');
  } else {
    state.guildRoster[existingIndex] = heroData;
    showToast(`${h.name} mis à jour`, 'i-save');
    playSound('click');
  }

  saveGuildRoster();
  clearDraft();
  renderGuildHall();
  renderHeroCard();
  updateCompletionBadges();
}

// ==========================================================================
// UI HELPERS
// ==========================================================================
function setView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('is-active', v.dataset.view === view);
    v.hidden = v.dataset.view !== view;
  });
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === view);
    btn.setAttribute('aria-selected', btn.dataset.view === view);
  });
  document.querySelectorAll('.bottom-tab').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === view);
  });

  // Scroll top
  window.scrollTo(0, 0);

  // Mettre à jour le titre
  document.title = view === 'forge' ? 'Aetheria · Forge' : 'Aetheria · Guilde';

  // Rendu spécifique à la vue
  if (view === 'guild') {
    renderGuildHall();
  }
}

function setTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.editor-tab').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active);
  });
  document.querySelectorAll('.panel').forEach(panel => {
    const active = panel.id === `panel-${tab}`;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
}

function setSubtab(subtab) {
  state.currentSubtab = subtab;
  renderSubtabs();
}

function setGuildFilter(filter) {
  state.currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(btn => {
    const active = btn.dataset.filter === filter;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active);
  });
  renderGuildHall();
}

function updateNavigation() {
  // Badge count
  const count = state.guildRoster.length;
  const badge = document.getElementById('guild-badge-count');
  if (badge) badge.textContent = count;
}

function updateCompletionBadges() {
  const h = state.hero;
  let completed = 0;
  const total = 7; // nom, guilde, classe, titre, 4 stats, 3 grimoire

  if (h.name.trim()) completed++;
  if (h.guild.trim()) completed++;
  if (h.classKey) completed++;
  if (h.title.trim()) completed++;
  if (h.ultimate.trim()) completed++;
  if (h.weakness.trim()) completed++;
  if (h.potion.trim()) completed++;

  const percent = Math.round((completed / total) * 100);

  document.querySelectorAll('.completion-progress').forEach(circle => {
    const circumference = 2 * Math.PI * 20;
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  });
  document.querySelectorAll('.completion-text').forEach(el => el.textContent = `${percent}%`);
}

function updateSoundButton() {
  const btn = document.getElementById('sound-btn');
  const icon = btn.querySelector('svg use');
  if (state.soundEnabled) {
    icon.setAttribute('href', '#i-volume');
    btn.setAttribute('aria-label', 'Désactiver les sons');
  } else {
    icon.setAttribute('href', '#i-mute');
    btn.setAttribute('aria-label', 'Activer les sons');
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  state.settings.sound = state.soundEnabled;
  saveSettings();
  updateSoundButton();
  if (state.soundEnabled) playSound('click');
  showToast(state.soundEnabled ? 'Sons activés' : 'Sons coupés', state.soundEnabled ? 'i-volume' : 'i-mute');
}

// ==========================================================================
// AUDIO ENGINE
// ==========================================================================
function initAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
    // Débloquer sur interaction
    document.body.addEventListener('click', unlockAudio, { once: true });
    document.body.addEventListener('keydown', unlockAudio, { once: true });
  } catch (e) {
    console.warn('Web Audio non supporté:', e);
  }
}

function unlockAudio() {
  if (state.audioCtx && state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
}

function playSound(type) {
  if (!state.soundEnabled || !state.audioCtx) return;
  const ctx = state.audioCtx;
  const now = ctx.currentTime;

  const sounds = {
    click: () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    },
    equip: () => {
      [660, 880, 1100].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.04, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.12);
      });
    },
    diceRoll: () => {
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200 + Math.random() * 400, now + i * 0.03);
        gain.gain.setValueAtTime(0.03, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.02);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.02);
      }
    },
    fanfare: () => {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    }
  };

  if (sounds[type]) sounds[type]();
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, iconId, isError = false) {
  const stack = document.getElementById('toast-stack');
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.innerHTML = `<svg class="toast-icon"><use href="#${iconId}"/></svg><span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// ==========================================================================
// PARTICULES AMBIANTES
// ==========================================================================
function spawnParticles(type) {
  const container = document.getElementById('portrait-particles');
  if (!container) return;
  container.innerHTML = '';

  if (type === 'none' || state.settings.reducedMotion) return;

  const particleData = GAME_DATA.PARTICLES.find(p => p.id === type);
  if (!particleData || !particleData.svg) return;

  // Créer quelques particules animées
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.className = 'ambient-particle';
    particle.innerHTML = particleData.svg;
    particle.style.cssText = `
      position: absolute;
      left: ${10 + Math.random() * 80}%;
      top: ${10 + Math.random() * 80}%;
      width: ${12 + Math.random() * 20}px;
      height: ${12 + Math.random() * 20}px;
      pointer-events: none;
      animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 2}s;
      opacity: ${0.4 + Math.random() * 0.4};
    `;
    container.appendChild(particle);
  }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
function attachEventListeners() {
  // Navigation vues
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // Onglets éditeur
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  // Sous-onglets apparence
  document.querySelectorAll('.subtab').forEach(btn => {
    btn.addEventListener('click', () => setSubtab(btn.dataset.subtab));
  });

  // Filtres guilde
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => setGuildFilter(btn.dataset.filter));
  });

  // Recherche guilde
  document.getElementById('guild-search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderGuildHall();
  });

  // Classes (delegated event listener on class-grid)
  document.getElementById('class-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (!card) return;
    state.hero.classKey = card.dataset.class;
    const cls = GAME_DATA.CLASSES[card.dataset.class];
    state.hero.stats = { ...cls.defaultStats };
    state.hero.appearance.race = cls.bodyType || 'human';
    state.hero.appearance.build = cls.build || 'average';
    state.hero.appearance.height = cls.height || 'average';
    state.hero.appearance.outfit = cls.outfitPreset;
    state.hero.appearance.aura = cls.id === 'paladin' ? 'gold' : cls.id === 'ranger' ? 'emerald' : cls.id === 'bard' ? 'violet' : 'cyan';
    renderAll();
    saveDraft();
    playSound('equip');
  });
  document.getElementById('class-grid')?.addEventListener('keydown', (e) => {
    const card = e.target.closest('.class-card');
    if (!card) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  // Inputs identité
  ['hero-name', 'hero-guild', 'hero-title'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      state.hero[id.replace('hero-', '')] = e.target.value;
      renderHeroCard();
      saveDraft();
    });
  });

  // Stats sliders
  ['social', 'speed', 'channel', 'chaos'].forEach(stat => {
    document.getElementById(`stat-${stat}`).addEventListener('input', (e) => {
      state.hero.stats[stat] = parseInt(e.target.value);
      renderAttributesPanel();
      renderHeroCard();
      saveDraft();
    });
  });

  // Grimoire textareas
  ['ultimate', 'weakness', 'potion'].forEach(field => {
    document.getElementById(`grimoire-${field}`).addEventListener('input', (e) => {
      state.hero[field] = e.target.value;
      updateMarkdownPreview();
      renderHeroCard();
      saveDraft();
    });
  });

  // Snippets grimoire
  document.querySelectorAll('.snippet-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.closest('.snippet-chips').dataset.target;
      const textarea = document.getElementById(target);
      const current = textarea.value;
      const addition = btn.dataset.text;
      textarea.value = current ? current + ' ' + addition : addition;
      textarea.dispatchEvent(new Event('input'));
      playSound('click');
    });
  });

  // Actions principales
  document.getElementById('btn-randomize').addEventListener('click', randomizeAppearance);
  document.getElementById('btn-apply-class-preset').addEventListener('click', applyClassPreset);
  document.getElementById('btn-export-png').addEventListener('click', exportPNG);
  document.getElementById('btn-save-hero').addEventListener('click', saveHero);
  document.getElementById('btn-roll-dice').addEventListener('click', rollFateDice);
  document.getElementById('btn-dice-bottom').addEventListener('click', rollFateDice);
  document.getElementById('btn-random-appearance').addEventListener('click', randomizeAppearance);
  document.getElementById('btn-copy-markdown').addEventListener('click', copyMarkdown);
  document.getElementById('btn-share-hero').addEventListener('click', () => shareHero(state.hero));
  document.getElementById('btn-new-first-hero').addEventListener('click', () => { setView('forge'); createNewHero(); });

  // Son
  document.getElementById('sound-btn').addEventListener('click', toggleSound);

  // Protocole modal
  document.getElementById('protocol-btn').addEventListener('click', () => document.getElementById('modal-protocol').showModal());
  document.getElementById('protocol-close').addEventListener('click', () => document.getElementById('modal-protocol').close());
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('dialog').close());
  });

  // Fermer modaux sur clic backdrop
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });

  // Échap pour fermer modaux
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('dialog[open]').forEach(d => d.close());
    }
  });

  // Auto-save draft on input
  let draftSaveTimer;
  document.addEventListener('input', () => {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(saveDraft, 1000);
  });
}

// ==========================================================================
// PWA INSTALL
// ==========================================================================
let deferredPrompt = null;

function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-btn').style.display = 'flex';
  });

  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Application installée !', 'i-install');
    }
    deferredPrompt = null;
    document.getElementById('install-btn').style.display = 'none';
  });

  window.addEventListener('appinstalled', () => {
    document.getElementById('install-btn').style.display = 'none';
    deferredPrompt = null;
  });
}

// ==========================================================================
// KEYBOARD SHORTCUTS
// ==========================================================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignorer si dans un input
    if (e.target.matches('input, textarea, select')) return;

    // Ctrl/Cmd + S -> Sauvegarder
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveHero();
    }

    // Ctrl/Cmd + E -> Exporter PNG
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportPNG();
    }

    // Ctrl/Cmd + D -> Dé du destin
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      rollFateDice();
    }

    // Chiffres 1-4 pour onglets
    if (e.key >= '1' && e.key <= '4') {
      const tabs = ['identity', 'appearance', 'attributes', 'grimoire'];
      setTab(tabs[parseInt(e.key) - 1]);
    }

    // Flèches pour navigation appearance
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const subtabs = ['body', 'face', 'hair', 'gear', 'backdrop'];
      const current = subtabs.indexOf(state.currentSubtab);
      if (current !== -1) {
        const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + subtabs.length) % subtabs.length;
        setSubtab(subtabs[next]);
      }
    }
  });
}

// ==========================================================================
// EXPORTS GLOBAUX (pour onclick inline)
// ==========================================================================
window.setView = setView;
window.setTab = setTab;
window.setSubtab = setSubtab;
window.setGuildFilter = setGuildFilter;
window.loadHeroToForge = loadHeroToForge;
window.duplicateHero = duplicateHero;
window.shareHero = shareHero;
window.confirmDeleteHero = confirmDeleteHero;
window.closeModal = closeModal;
window.rollFateDice = rollFateDice;
window.randomizeAppearance = randomizeAppearance;
window.applyClassPreset = applyClassPreset;
window.saveHero = saveHero;
window.exportPNG = exportPNG;
window.copyMarkdown = copyMarkdown;
window.toggleSound = toggleSound;