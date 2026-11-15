// Aetheria 3D — Main Application Logic
import { API, OfflineAPI } from './api.js';
import { Avatar3D, getBackdropGradient, getArtifactIcon } from './avatar3d.js';
import { GAME_DATA } from './data.js';
import { DungeonGame } from './dungeon.js';
import { createZip, dataUrlToBytes } from './zip.js';

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================
const state = {
  // Current hero being edited
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
      race: 'human', skin: 'peach', build: 'average', height: 'average', posture: 'straight',
      face: 'oval', eyes: 'amber', expression: 'determined', mark: 'none',
      facialHair: 'none', warpaint: 'none',
      hairStyle: 'crew', hairColor: 'darkbrown', hairHighlight: 'none',
      outfit: 'plate-gold', headgear: 'none', artifact: 'scroll',
      aura: 'gold', frame: 'classic',
      backdrop: 'fortress', lighting: 'natural', particles: 'sparkles'
    }
  },

  // Guild roster
  guildRoster: [],

  // UI State
  currentView: 'forge',
  currentTab: 'identity',
  currentSubtab: 'body',
  currentFilter: 'all',
  searchQuery: '',

  // Settings
  settings: { sound: true, reducedMotion: false, autoSave: true },

  // Audio
  audioCtx: null,
  soundEnabled: true,

  // 3D Avatar
  avatar3D: null,

  // Draft (local backup)
  draft: null
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
export class App {
  constructor() {
    this.avatar3D = null;
    this.theme = 'dark';
  }

  initTheme() {
    const initial = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    this.applyTheme(initial, false);
    document.getElementById('theme-btn')?.addEventListener('click', () => this.toggleTheme());
    if (!this._themeMediaBound && window.matchMedia) {
      this._themeMediaBound = true;
      this._themeMedia = window.matchMedia('(prefers-color-scheme: light)');
      const onChange = (event) => {
        let saved = null;
        try { saved = localStorage.getItem('aetheria_theme'); } catch (e) { /* ignore */ }
        if (!saved) this.applyTheme(event.matches ? 'light' : 'dark', false);
      };
      if (this._themeMedia.addEventListener) this._themeMedia.addEventListener('change', onChange);
      else if (this._themeMedia.addListener) this._themeMedia.addListener(onChange);
    }
  }

  toggleTheme() {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  applyTheme(theme, persist = true) {
    const next = theme === 'light' ? 'light' : 'dark';
    this.theme = next;
    document.documentElement.dataset.theme = next;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#f3ede0' : '#08070b');
    const btn = document.getElementById('theme-btn');
    if (btn) {
      const light = next === 'light';
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.setAttribute('aria-label', light ? 'Passer en mode sombre' : 'Passer en mode clair');
      btn.title = light ? 'Mode sombre' : 'Mode clair';
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', light ? '#i-moon' : '#i-sun');
    }
    if (persist) {
      try { localStorage.setItem('aetheria_theme', next); } catch (e) { /* ignore */ }
      if (this.playSound) this.playSound('click');
    }
  }

  async init() {
    console.log('[Aetheria] Initializing...');

    // Theme (avant le premier rendu pour éviter un flash)
    this.initTheme();

    // Load settings
    this.loadSettings();

    // Initialize audio
    this.initAudio();

    // Initialize 3D Avatar
    await this.initAvatar3D();

    // Load data (roster + draft)
    await this.loadData();

    // Render UI
    this.renderAll();

    // Dungeon Master (MJ IA)
    this.initDungeon();

    // Lien direct vers une vue (?view=guild|dungeon|forge)
    try {
      const viewParam = new URLSearchParams(location.search).get('view');
      if (viewParam && ['forge', 'dungeon', 'guild'].includes(viewParam)) this.setView(viewParam);
    } catch (e) { /* ignore */ }

    // Attach event listeners
    this.attachEventListeners();

    // Setup PWA
    this.setupPWA();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Reduced motion detection
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.settings.reducedMotion = mq.matches;
    document.body.classList.toggle('reduce-motion', mq.matches);
    mq.addEventListener('change', e => {
      state.settings.reducedMotion = e.matches;
      document.body.classList.toggle('reduce-motion', e.matches);
    });

    console.log('[Aetheria] Ready!');
  }

  async initAvatar3D() {
    const container = document.getElementById('avatar-canvas-wrap');
    if (!container) return;

    this.avatar3D = new Avatar3D();
    this.avatar3D.init(container, { width: 400, height: 480 });
    state.avatar3D = this.avatar3D;

    // Generate initial avatar
    this.avatar3D.generate(state.hero.appearance, state.hero.classKey);
  }

  initDungeon() {
    if (!this.dungeonGame) {
      this.dungeonGame = new DungeonGame({
        getRoster: () => state.guildRoster,
        renderThumb: (appearance, classKey, target, size) => this.avatar3D?.generateThumb(appearance, classKey, target, size),
        toast: (message, icon, isError) => this.showToast(message, icon, isError),
        sound: (type) => this.playSound(type)
      });
    }
    this.dungeonGame.init();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('aetheria_settings');
      if (saved) state.settings = { ...state.settings, ...JSON.parse(saved) };
    } catch (e) { console.warn('Settings load error:', e); }
    state.soundEnabled = state.settings.sound;
    this.updateSoundButton();
  }

  saveSettings() {
    try { localStorage.setItem('aetheria_settings', JSON.stringify(state.settings)); } catch (e) {}
  }

  async loadData() {
    // Load guild roster from API
    try {
      const { heroes } = await OfflineAPI.getHeroes();
      state.guildRoster = heroes;
    } catch (e) {
      console.warn('Roster load failed:', e);
      state.guildRoster = GAME_DATA.DEFAULT_GUILD_ROSTER;
    }

    // Load draft
    try {
      const saved = localStorage.getItem('aetheria_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.timestamp && Date.now() - draft.timestamp < 7 * 24 * 60 * 60 * 1000) {
          state.hero = { ...state.hero, ...draft.hero };
          state.draft = draft;
          return;
        }
      }
    } catch (e) { console.warn('Draft load error:', e); }

    // No valid draft - create new hero
    this.createNewHero();
  }

  createNewHero() {
    const defaults = GAME_DATA.CLASSES.paladin;
    state.hero = {
      name: '', guild: '', classKey: 'paladin', title: '',
      stats: { ...defaults.defaultStats },
      ultimate: '', weakness: '', potion: '',
      appearance: {
        race: 'human', skin: 'peach', build: 'average', height: 'average', posture: 'straight',
        face: 'oval', eyes: 'amber', expression: 'determined', mark: 'none',
        facialHair: 'none', warpaint: 'none',
        hairStyle: 'crew', hairColor: 'darkbrown', hairHighlight: 'none',
        outfit: defaults.outfitPreset, headgear: 'none', artifact: 'scroll',
        aura: 'gold', frame: 'classic',
        backdrop: 'fortress', lighting: 'natural', particles: 'sparkles'
      }
    };
    this.saveDraft();
    this.showToast('Nouveau héros créé', 'i-sparkles');
  }

  saveDraft() {
    if (!state.settings.autoSave) return;
    try {
      const draft = { hero: { ...state.hero }, timestamp: Date.now() };
      localStorage.setItem('aetheria_draft', JSON.stringify(draft));
      state.draft = draft;
    } catch (e) { console.warn('Draft save error:', e); }
  }

  clearDraft() {
    try { localStorage.removeItem('aetheria_draft'); } catch (e) { console.warn('Draft clear error:', e); }
    state.draft = null;
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  renderAll() {
    this.renderHeroCard();
    this.renderIdentityPanel();
    this.renderAppearancePanel();
    this.renderAttributesPanel();
    this.renderGrimoirePanel();
    this.renderGuildHall();
    this.updateCompletionBadges();
    this.updateNavigation();
  }

  renderHeroCard() {
    const h = state.hero;
    const cls = GAME_DATA.CLASSES[h.classKey];

    document.getElementById('portrait-name').textContent = h.name || '—';
    document.getElementById('portrait-title').textContent = h.title || '—';
    document.getElementById('portrait-guild').textContent = h.guild || 'Sans guilde';
    document.getElementById('portrait-motto').textContent = h.classKey ? `« ${cls.spec} »` : '« Prêt à forger ta légende ? »';

    // Update 3D avatar
    if (this.avatar3D) {
      this.avatar3D.generate(h.appearance, h.classKey);
      this.updateClassGlow(cls);
    }

    // Compact preview (mobile/tablet)
    const avatarImg = document.getElementById('avatar-canvas-wrap-img');
    const miniAvatar = document.getElementById('hero-mini-avatar');
    if (avatarImg && miniAvatar) miniAvatar.src = avatarImg.src;
    const miniName = document.getElementById('hero-mini-name');
    if (miniName) miniName.textContent = h.name || 'Nouveau héros';
    const miniClass = document.getElementById('hero-mini-class');
    if (miniClass) miniClass.textContent = cls ? `${cls.name} · ${cls.role}` : 'Choisis une classe';

    // Stats on card
    this.updateStatDisplay('social', h.stats.social);
    this.updateStatDisplay('speed', h.stats.speed);
    this.updateStatDisplay('channel', h.stats.channel);
    this.updateStatDisplay('chaos', h.stats.chaos);

    // Grimoire on card
    document.getElementById('card-ultimate-txt').textContent = h.ultimate || '—';
    document.getElementById('card-weakness-txt').textContent = h.weakness || '—';
    document.getElementById('card-potion-txt').textContent = h.potion || '—';

    this.drawRadarChart(h.stats);
  }

  updateClassGlow(cls) {
    const glowEl = document.getElementById('portrait-glow');
    if (glowEl) glowEl.style.background = cls.glow || cls.color;
  }

  updateStatDisplay(stat, value) {
    const percent = (value / 5) * 100;
    const disp = document.getElementById(`disp-stat-${stat}`);
    if (disp) disp.textContent = `${value}/5`;
    const bar = document.getElementById(`bar-stat-${stat}`);
    if (bar) bar.style.setProperty('--stat-fill', `${percent}%`);
  }

  drawRadarChart(stats) {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${size}px`;
    canvas.style.height = 'auto';
    ctx.scale(dpr, dpr);

    const center = { x: size / 2, y: size / 2 };
    const maxRadius = 110;
    const axes = ['social', 'speed', 'channel', 'chaos'];
    const colors = { social: '#78aaff', speed: '#e4bf70', channel: '#4dc397', chaos: '#b389ff' };

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
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath(); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(228,191,112,0.15)';
    axes.forEach((axis, i) => {
      const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x + Math.cos(angle) * maxRadius, center.y + Math.sin(angle) * maxRadius);
      ctx.stroke();
    });

    // Labels
    ctx.font = '11px "Cinzel", serif'; ctx.fillStyle = '#d6cdbf';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    axes.forEach((axis, i) => {
      const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
      const radius = maxRadius + 20;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      const labels = { social: 'Mana Social', speed: 'Initiative', channel: 'Canal', chaos: 'Pivots' };
      ctx.fillText(labels[axis], x, y);
    });

    // Polygon
    ctx.beginPath();
    axes.forEach((axis, i) => {
      const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
      const value = stats[axis] / 5;
      const radius = value * maxRadius;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();

    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, maxRadius);
    gradient.addColorStop(0, 'rgba(228,191,112,0.35)');
    gradient.addColorStop(1, 'rgba(228,191,112,0.05)');
    ctx.fillStyle = gradient; ctx.fill();

    ctx.strokeStyle = '#e4bf70'; ctx.lineWidth = 2;
    ctx.shadowColor = '#e4bf70'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;

    // Points
    ctx.fillStyle = '#fff7dc';
    axes.forEach((axis, i) => {
      const angle = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
      const value = stats[axis] / 5;
      const radius = value * maxRadius;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b8963e'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Values
    ctx.font = 'bold 12px "JetBrains Mono", monospace'; ctx.fillStyle = '#e4bf70';
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
  // PANEL RENDERERS
  // ==========================================================================
  renderIdentityPanel() {
    const h = state.hero;
    const cls = GAME_DATA.CLASSES[h.classKey];

    document.getElementById('hero-name').value = h.name;
    document.getElementById('hero-guild').value = h.guild;
    document.getElementById('hero-title').value = h.title;

    document.querySelectorAll('.class-card').forEach(card => {
      const ck = card.dataset.class;
      const isActive = ck === h.classKey;
      card.setAttribute('aria-checked', isActive);
      card.classList.toggle('is-active', isActive);
    });
  }

  renderAppearancePanel() {
    const a = state.hero.appearance;

    this.renderSubtabs();
    this.renderRaceGrid();
    this.renderSkinGrid();
    this.renderBuildGrid();
    this.renderHeightGrid();
    this.renderPostureGrid();
    this.renderFaceGrid();
    this.renderEyeGrid();
    this.renderExpressionGrid();
    this.renderMarkGrid();
    this.renderFacialHairGrid();
    this.renderWarpaintGrid();
    this.renderHairstyleGrid();
    this.renderHairColorGrid();
    this.renderHairHighlightGrid();
    this.renderOutfitGrid();
    this.renderHeadgearGrid();
    this.renderArtifactGrid();
    this.renderAuraGrid();
    this.renderFrameGrid();
    this.renderBackdropGrid();
    this.renderLightingGrid();
    this.renderParticlesGrid();

    this.updateAppearanceLabels();
  }

  renderSubtabs() {
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

  updateAppearanceLabels() {
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
    document.getElementById('val-outfit').textContent = this.getOutfitName(state.hero.classKey, a.outfit);
    document.getElementById('val-headgear').textContent = getName(GAME_DATA.HEADGEAR, a.headgear);
    document.getElementById('val-artifact').textContent = getName(GAME_DATA.ARTIFACTS, a.artifact);
    document.getElementById('val-aura').textContent = getName(GAME_DATA.AURAS, a.aura);
    document.getElementById('val-frame').textContent = getName(GAME_DATA.FRAMES, a.frame);
    document.getElementById('val-backdrop').textContent = getName(GAME_DATA.BACKDROPS, a.backdrop);
    document.getElementById('val-lighting').textContent = getName(GAME_DATA.LIGHTINGS, a.lighting);
    document.getElementById('val-particles').textContent = getName(GAME_DATA.PARTICLES, a.particles);
  }

  getOutfitName(classKey, outfitId) {
    const outfits = GAME_DATA.OUTFITS[classKey] || [];
    return outfits.find(o => o.id === outfitId)?.name || outfitId;
  }

  // ---- Grid Renderers ----
  createOptionButton(item, isActive, onClick, extraClass = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `option-card ${extraClass} ${isActive ? 'is-active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isActive);
    btn.dataset.value = item.id;
    btn.addEventListener('click', () => {
      onClick(item.id);
      this.markSelected(btn);
      this.updateAppearanceLabels();
    });
    return btn;
  }

  createSwatchButton(item, isActive, onClick, colorProp = 'base') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `swatch-btn ${isActive ? 'is-active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isActive);
    btn.setAttribute('aria-label', item.name);
    btn.dataset.value = item.id;
    btn.dataset.swatch = item.id;
    const color = item[colorProp] || item.base || item.color;
    btn.style.setProperty('--swatch-color', color);
    if (item.id === 'none') btn.style.background = 'repeating-conic-gradient(from 45deg, var(--bg-deep) 0 10px, var(--bg-panel) 10px 20px)';
    else btn.style.background = color;
    btn.innerHTML = '<span class="swatch-dot"></span>';
    btn.addEventListener('click', () => {
      onClick(item.id);
      this.markSelected(btn);
      this.updateAppearanceLabels();
    });
    return btn;
  }

  // Reflect the active choice immediately in the grid (for handlers that do not re-render it).
  markSelected(btn) {
    const group = btn && btn.parentElement;
    if (!group) return;
    group.querySelectorAll('.is-active').forEach(el => {
      el.classList.remove('is-active');
      el.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-checked', 'true');
  }

  renderRaceGrid() {
    const grid = document.getElementById('race-grid');
    const current = state.hero.appearance.race;
    grid.innerHTML = '';
    GAME_DATA.RACES.forEach(race => {
      const btn = this.createOptionButton(race, race.id === current, (id) => {
        state.hero.appearance.race = id;
        const r = GAME_DATA.RACES.find(x => x.id === id);
        if (r) {
          if (r.skinTones && !r.skinTones.includes(state.hero.appearance.skin)) {
            state.hero.appearance.skin = r.skinTones[0];
          }
          if (r.build) state.hero.appearance.build = r.build;
          if (r.height) state.hero.appearance.height = r.height;
          if (r.baseBody === 'elf') state.hero.appearance.face = 'oval';
        }
        this.renderAppearancePanel();
        this.renderHeroCard();
        this.saveDraft();
        this.playSound('equip');
      }, 'race-card');
      btn.innerHTML = `<svg viewBox="0 0 64 64" class="race-glyph"><use href="#i-${race.id === 'human' ? 'users' : race.id === 'elf' ? 'mask' : race.id === 'dwarf' ? 'hammer' : race.id === 'orc' ? 'shield' : race.id === 'tiefling' ? 'flame' : 'feather'}"/></svg><span>${race.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderSkinGrid() {
    const grid = document.getElementById('skin-grid');
    const current = state.hero.appearance.skin;
    const race = GAME_DATA.RACES.find(r => r.id === state.hero.appearance.race);
    const allowed = race?.skinTones || Object.keys(GAME_DATA.SKIN_TONES);
    grid.innerHTML = '';
    allowed.forEach(key => {
      const skin = GAME_DATA.SKIN_TONES[key];
      if (!skin) return;
      const btn = this.createSwatchButton({ id: key, name: skin.name, base: skin.base }, key === current, (id) => {
        state.hero.appearance.skin = id;
        this.renderHeroCard();
        this.renderHairstyleGrid();
        this.saveDraft(); this.playSound('equip');
      });
      grid.appendChild(btn);
    });
  }

  renderBuildGrid() {
    const grid = document.getElementById('build-grid');
    const current = state.hero.appearance.build;
    grid.innerHTML = '';
    GAME_DATA.BUILDS.forEach(b => {
      const btn = this.createOptionButton(b, b.id === current, (id) => {
        state.hero.appearance.build = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${b.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderHeightGrid() {
    const grid = document.getElementById('height-grid');
    const current = state.hero.appearance.height;
    grid.innerHTML = '';
    GAME_DATA.HEIGHTS.forEach(h => {
      const btn = this.createOptionButton(h, h.id === current, (id) => {
        state.hero.appearance.height = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${h.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderPostureGrid() {
    const grid = document.getElementById('posture-grid');
    const current = state.hero.appearance.posture;
    grid.innerHTML = '';
    GAME_DATA.POSTURES.forEach(p => {
      const btn = this.createOptionButton(p, p.id === current, (id) => {
        state.hero.appearance.posture = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${p.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderFaceGrid() {
    const grid = document.getElementById('face-grid');
    const current = state.hero.appearance.face;
    grid.innerHTML = '';
    GAME_DATA.FACE_SHAPES.forEach(f => {
      const btn = this.createOptionButton(f, f.id === current, (id) => {
        state.hero.appearance.face = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${f.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderEyeGrid() {
    const grid = document.getElementById('eye-grid');
    const current = state.hero.appearance.eyes;
    grid.innerHTML = '';
    Object.entries(GAME_DATA.EYE_COLORS).forEach(([key, eye]) => {
      const btn = this.createSwatchButton({ id: key, name: eye.name, base: eye.iris }, key === current, (id) => {
        state.hero.appearance.eyes = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      }, 'iris');
      grid.appendChild(btn);
    });
  }

  renderExpressionGrid() {
    const grid = document.getElementById('expression-grid');
    const current = state.hero.appearance.expression;
    grid.innerHTML = '';
    GAME_DATA.EXPRESSIONS.forEach(e => {
      const btn = this.createOptionButton(e, e.id === current, (id) => {
        state.hero.appearance.expression = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${e.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderMarkGrid() {
    const grid = document.getElementById('mark-grid');
    const current = state.hero.appearance.mark;
    grid.innerHTML = '';
    GAME_DATA.MARKS.forEach(m => {
      const btn = this.createOptionButton(m, m.id === current, (id) => {
        state.hero.appearance.mark = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${m.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderFacialHairGrid() {
    const grid = document.getElementById('facial-hair-grid');
    const current = state.hero.appearance.facialHair;
    grid.innerHTML = '';
    GAME_DATA.FACIAL_HAIR.forEach(f => {
      const btn = this.createOptionButton(f, f.id === current, (id) => {
        state.hero.appearance.facialHair = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${f.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderWarpaintGrid() {
    const grid = document.getElementById('warpaint-grid');
    const current = state.hero.appearance.warpaint;
    grid.innerHTML = '';
    GAME_DATA.WARPAINTS.forEach(w => {
      const btn = this.createOptionButton(w, w.id === current, (id) => {
        state.hero.appearance.warpaint = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${w.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderHairstyleGrid() {
    const grid = document.getElementById('hairstyle-grid');
    const current = state.hero.appearance.hairStyle;
    grid.innerHTML = '';
    GAME_DATA.HAIRSTYLES.forEach(h => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `hair-thumb ${h.id === current ? 'is-active' : ''}`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', h.id === current);
      btn.setAttribute('aria-label', h.name);
      btn.title = h.name;
      btn.dataset.value = h.id;
      btn.innerHTML = `<span class="hair-thumb-img"></span><span class="hair-thumb-label">${h.name}</span>`;
      const preview = btn.querySelector('.hair-thumb-img');
      if (this.avatar3D && preview) {
        const img = document.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = this.avatar3D.hairThumb(state.hero.appearance, h.id);
        preview.appendChild(img);
      }
      btn.addEventListener('click', () => {
        state.hero.appearance.hairStyle = h.id;
        this.renderAppearancePanel();
        this.renderHeroCard();
        this.saveDraft();
        this.playSound('equip');
      });
      grid.appendChild(btn);
    });
  }

  renderHairColorGrid() {
    const grid = document.getElementById('hair-color-grid');
    const current = state.hero.appearance.hairColor;
    grid.innerHTML = '';
    Object.entries(GAME_DATA.HAIR_COLORS).forEach(([key, hc]) => {
      const btn = this.createSwatchButton({ id: key, name: hc.name, base: hc.base }, key === current, (id) => {
        state.hero.appearance.hairColor = id;
        this.renderHeroCard();
        this.renderHairstyleGrid();
        this.saveDraft(); this.playSound('equip');
      });
      grid.appendChild(btn);
    });
  }

  renderHairHighlightGrid() {
    const grid = document.getElementById('hair-highlight-grid');
    const current = state.hero.appearance.hairHighlight;
    grid.innerHTML = '';
    GAME_DATA.HAIR_HIGHLIGHTS.forEach(h => {
      const btn = this.createSwatchButton(h, h.id === current, (id) => {
        state.hero.appearance.hairHighlight = id;
        this.renderHeroCard();
        this.renderHairstyleGrid();
        this.saveDraft(); this.playSound('equip');
      }, 'color');
      grid.appendChild(btn);
    });
  }

  renderOutfitGrid() {
    const grid = document.getElementById('outfit-grid');
    const current = state.hero.appearance.outfit;
    const outfits = GAME_DATA.OUTFITS[state.hero.classKey] || [];
    grid.innerHTML = '';
    outfits.forEach(o => {
      const btn = this.createOptionButton(o, o.id === current, (id) => {
        state.hero.appearance.outfit = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      }, 'outfit-card');
      const previewSvg = this.getOutfitPreviewSVG(state.hero.classKey, o.id);
      btn.innerHTML = `${previewSvg}<div><span class="outfit-name">${o.name}</span></div>`;
      grid.appendChild(btn);
    });
  }

  getOutfitPreviewSVG(classKey, outfitId) {
    const previews = {
      paladin: { 'plate-gold': '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="28" rx="18" ry="14" fill="#c8c8d0" stroke="#e4bf70" stroke-width="2"/><ellipse cx="32" cy="28" rx="12" ry="8" fill="#e4bf70" opacity=".3"/></svg>' },
      ranger: { 'leather-green': '<svg viewBox="0 0 64 64"><path d="M12 20 L20 12 L44 12 L52 20 L52 52 L12 52 Z" fill="#382818" stroke="#181008" stroke-width="1.5"/></svg>' },
      bard: { 'velvet-red': '<svg viewBox="0 0 64 64"><path d="M12 20 L20 12 L44 12 L52 20 L52 52 L12 52 Z" fill="#b83030" stroke="#e4bf70" stroke-width="1.5"/></svg>' },
      alchemist: { 'apron-leather': '<svg viewBox="0 0 64 64"><path d="M12 20 L20 12 L44 12 L52 20 L52 52 L12 52 Z" fill="#182028" stroke="#283040" stroke-width="1.5"/><rect x="18" y="30" width="28" height="10" fill="#382818" stroke="#181008" stroke-width="1"/></svg>' }
    };
    return previews[classKey]?.[outfitId] || '<svg viewBox="0 0 64 64"><rect x="12" y="12" width="40" height="40" fill="#383848"/></svg>';
  }

  renderHeadgearGrid() {
    const grid = document.getElementById('headgear-grid');
    const current = state.hero.appearance.headgear;
    grid.innerHTML = '';
    GAME_DATA.HEADGEAR.forEach(h => {
      const btn = this.createOptionButton(h, h.id === current, (id) => {
        state.hero.appearance.headgear = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${h.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderArtifactGrid() {
    const grid = document.getElementById('artifact-grid');
    const current = state.hero.appearance.artifact;
    grid.innerHTML = '';
    GAME_DATA.ARTIFACTS.forEach(a => {
      const btn = this.createOptionButton(a, a.id === current, (id) => {
        state.hero.appearance.artifact = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      const icon = getArtifactIcon(a.id);
      btn.innerHTML = `${icon ? `<svg class="artifact-option-icon"><use href="#${icon}"/></svg>` : ''}<span>${a.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderAuraGrid() {
    const grid = document.getElementById('aura-grid');
    const current = state.hero.appearance.aura;
    grid.innerHTML = '';
    GAME_DATA.AURAS.forEach(a => {
      const btn = this.createOptionButton(a, a.id === current, (id) => {
        state.hero.appearance.aura = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      }, 'aura-card');
      btn.innerHTML = a.id !== 'none' ? `<div style="width:40px;height:40px;border-radius:50%;background:${a.color};box-shadow:0 0 12px ${a.color}"></div><span>${a.name}</span>` : `<span>${a.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderFrameGrid() {
    const grid = document.getElementById('frame-grid');
    const current = state.hero.appearance.frame;
    grid.innerHTML = '';
    GAME_DATA.FRAMES.forEach(f => {
      const btn = this.createOptionButton(f, f.id === current, (id) => {
        state.hero.appearance.frame = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      }, 'frame-card');
      btn.innerHTML = `<span>${f.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderBackdropGrid() {
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
      btn.title = b.name;
      btn.style.background = getBackdropGradient(b.id);
      btn.innerHTML = `<span>${b.name}</span>`;
      btn.addEventListener('click', () => {
        state.hero.appearance.backdrop = b.id;
        this.renderAppearancePanel();
        this.renderHeroCard();
        this.saveDraft();
        this.playSound('equip');
      });
      grid.appendChild(btn);
    });
  }

  renderLightingGrid() {
    const grid = document.getElementById('lighting-grid');
    const current = state.hero.appearance.lighting;
    grid.innerHTML = '';
    GAME_DATA.LIGHTINGS.forEach(l => {
      const btn = this.createOptionButton(l, l.id === current, (id) => {
        state.hero.appearance.lighting = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${l.name}</span>`;
      grid.appendChild(btn);
    });
  }

  renderParticlesGrid() {
    const grid = document.getElementById('particles-grid');
    const current = state.hero.appearance.particles;
    grid.innerHTML = '';
    GAME_DATA.PARTICLES.forEach(p => {
      const btn = this.createOptionButton(p, p.id === current, (id) => {
        state.hero.appearance.particles = id;
        this.renderHeroCard(); this.saveDraft(); this.playSound('equip');
      });
      btn.innerHTML = `<span>${p.name}</span>`;
      grid.appendChild(btn);
    });
  }

  // ==========================================================================
  // ATTRIBUTES PANEL
  // ==========================================================================
  renderAttributesPanel() {
    const h = state.hero;
    ['social', 'speed', 'channel', 'chaos'].forEach(stat => {
      const val = h.stats[stat];
      const slider = document.getElementById(`stat-${stat}`);
      if (slider) slider.value = val;
      const output = document.querySelector(`#stat-${stat} + .stat-value`);
      if (output) output.textContent = val;
      const desc = document.getElementById(`desc-${stat}`);
      if (desc) desc.textContent = GAME_DATA.STAT_TEXTS[stat][val] || '';
      this.updateStatDisplay(stat, val);
    });
    this.drawRadarChart(h.stats);
  }

  // ==========================================================================
  // GRIMOIRE PANEL
  // ==========================================================================
  renderGrimoirePanel() {
    const h = state.hero;
    document.getElementById('grimoire-ultimate').value = h.ultimate;
    document.getElementById('grimoire-weakness').value = h.weakness;
    document.getElementById('grimoire-potion').value = h.potion;
    this.updateMarkdownPreview();
  }

  updateMarkdownPreview() {
    const h = state.hero;
    const cls = GAME_DATA.CLASSES[h.classKey];
    const lines = [
      `## ${h.name || '—'}`,
      `**${h.title || '—'}** • ${cls?.name || '—'} • ${h.guild || 'Sans guilde'}`,
      '', '### ⚔️ Attributs',
      '| Mana Social | Initiative | Canal | Pivots |', '|:---:|:---:|:---:|:---:|',
      `| ${h.stats.social}/5 | ${h.stats.speed}/5 | ${h.stats.channel}/5 | ${h.stats.chaos}/5 |`,
      '', '### 📜 Grimoire',
      `**Don Ultime :** ${h.ultimate || '—'}`,
      `**Kryptonite :** ${h.weakness || '—'}`,
      `**Potion :** ${h.potion || '—'}`,
      '', `*Forgé dans la Forge d'Aetheria*`
    ];
    document.getElementById('markdown-preview').textContent = lines.join('\n');
  }

  // ==========================================================================
  // GUILD HALL
  // ==========================================================================
  renderGuildHall() {
    const grid = document.getElementById('guild-grid');
    const empty = document.getElementById('empty-state');
    const filter = state.currentFilter;
    const query = state.searchQuery.toLowerCase();

    // Header metrics (based on the full roster, not the filtered view)
    const rosterAll = state.guildRoster || [];
    const heroCount = rosterAll.length;
    const guildCount = new Set(rosterAll.map(h => (h.guild || '').trim()).filter(Boolean)).size;
    const legendCount = rosterAll.filter(h => h.isLegend).length;
    const setMetric = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setMetric('guild-metric-heroes', heroCount);
    setMetric('guild-metric-guilds', guildCount);
    setMetric('guild-metric-legends', legendCount);

    let roster = state.guildRoster;
    if (filter !== 'all') {
      if (filter === 'legends') roster = roster.filter(h => h.isLegend);
      else roster = roster.filter(h => h.classKey === filter);
    }
    if (query) {
      roster = roster.filter(h => h.name.toLowerCase().includes(query) || h.guild.toLowerCase().includes(query) || h.classKey.includes(query) || h.title.toLowerCase().includes(query));
    }

    const guildCountEl = document.getElementById('guild-count');
    if (guildCountEl) guildCountEl.textContent = roster.length;
    const exportAllBtn = document.getElementById('btn-export-all-guild');
    if (exportAllBtn) {
      const total = state.guildRoster.length;
      exportAllBtn.disabled = total === 0;
      exportAllBtn.title = total ? `Télécharger les ${total} fiches en PNG${total > 1 ? ' (ZIP)' : ''}` : 'Aucune fiche à télécharger';
    }

    if (roster.length === 0) { grid.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    grid.innerHTML = '';

    roster.forEach(hero => grid.appendChild(this.createGuildCard(hero)));

    // Add "New" card
    if (!query && filter === 'all') {
      const addCard = document.createElement('button');
      addCard.type = 'button';
      addCard.className = 'guild-add-card';
      addCard.setAttribute('role', 'listitem');
      addCard.innerHTML = `<div class="guild-add-icon"><svg><use href="#i-plus"/></svg></div><strong>Forger un nouvel aventurier</strong><span>Une fiche de plus, une devinette de moins pour ton équipe.</span>`;
      addCard.addEventListener('click', () => { this.setView('forge'); this.createNewHero(); });
      grid.appendChild(addCard);
    }
  }

  createGuildCard(hero) {
    const cls = GAME_DATA.CLASSES[hero.classKey] || {};
    const card = document.createElement('article');
    card.className = `guild-card ${hero.isLegend ? 'legend' : ''}`;
    card.setAttribute('role', 'listitem');
    card.dataset.id = hero.id;

    // Generate thumbnail using 3D avatar
    const visualDiv = document.createElement('div');
    visualDiv.className = 'guild-card-visual';

    card.innerHTML = `
      <div class="guild-card-visual" data-hero-id="${hero.id}"></div>
      <div class="guild-card-body">
        <header class="guild-card-head"><h3 class="guild-card-name">${this.escapeHtml(hero.name)}</h3><span class="guild-class-pill" style="--class-color:${cls.color || '#e4bf70'}"><svg><use href="#i-${cls.icon || 'i-shield'}"/></svg> ${this.escapeHtml(cls.name || 'Aventurier')}</span></header>
        <p class="guild-card-title">${this.escapeHtml(hero.title)}</p>
        <p class="guild-card-guild">${this.escapeHtml(hero.guild)}</p>
        <div class="guild-stats"><div class="guild-stat"><strong style="--stat-color:#78aaff">${hero.stats.social}</strong><span>Social</span></div><div class="guild-stat"><strong style="--stat-color:#e4bf70">${hero.stats.speed}</strong><span>Init.</span></div><div class="guild-stat"><strong style="--stat-color:#4dc397">${hero.stats.channel}</strong><span>Canal</span></div><div class="guild-stat"><strong style="--stat-color:#b389ff">${hero.stats.chaos}</strong><span>Pivots</span></div></div>
        <div class="guild-spells"><div class="guild-spell guild-spell--sun"><svg><use href="#i-sun"/></svg><span><strong>Don :</strong> ${this.escapeHtml(hero.ultimate)}</span></div><div class="guild-spell guild-spell--skull"><svg><use href="#i-skull"/></svg><span><strong>Kryptonite :</strong> ${this.escapeHtml(hero.weakness)}</span></div><div class="guild-spell guild-spell--potion"><svg><use href="#i-flask"/></svg><span><strong>Potion :</strong> ${this.escapeHtml(hero.potion)}</span></div></div>
        <footer class="guild-footer-meta"><span><svg><use href="#i-award"/></svg> ${hero.isLegend ? 'Légende' : 'Aventurier'}</span><span>ID: ${hero.id}</span></footer>
        <div class="guild-actions"><button class="guild-action" data-action="png" title="Télécharger en PNG"><svg><use href="#i-download"/></svg></button><button class="guild-action" data-action="edit" title="Charger dans la forge"><svg><use href="#i-edit"/></svg></button><button class="guild-action" data-action="duplicate" title="Dupliquer"><svg><use href="#i-copy"/></svg></button><button class="guild-action" data-action="share" title="Partager"><svg><use href="#i-share"/></svg></button>${!hero.isLegend ? `<button class="guild-action is-danger" data-action="delete" title="Retirer"><svg><use href="#i-trash"/></svg></button>` : ''}</div>
      </div>
    `;

    // Generate 3D thumbnail
    const visualContainer = card.querySelector('.guild-card-visual');
    if (this.avatar3D && visualContainer) {
      this.avatar3D.generateThumb(hero.appearance, hero.classKey, visualContainer, 128);
    }

    // Actions
    card.querySelector('[data-action="png"]').addEventListener('click', (e) => { e.stopPropagation(); this.openExportThemeDialog({ type: 'hero', hero, trigger: e.currentTarget }); });
    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => { e.stopPropagation(); this.loadHeroToForge(hero); });
    card.querySelector('[data-action="duplicate"]').addEventListener('click', (e) => { e.stopPropagation(); this.duplicateHero(hero); });
    card.querySelector('[data-action="share"]').addEventListener('click', (e) => { e.stopPropagation(); this.shareHero(hero); });
    const delBtn = card.querySelector('[data-action="delete"]');
    if (delBtn) delBtn.addEventListener('click', (e) => { e.stopPropagation(); this.confirmDeleteHero(hero); });

    card.addEventListener('click', (e) => { if (!e.target.closest('.guild-action')) this.openHeroModal(hero); });

    return card;
  }

  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

  // ==========================================================================
  // HERO ACTIONS
  // ==========================================================================
  async loadHeroToForge(hero) {
    state.hero = { ...hero };
    this.setView('forge');
    this.renderAll();
    this.showToast(`${hero.name} chargé dans la forge`, 'i-hammer');
    this.playSound('equip');
  }

  async duplicateHero(hero) {
    try {
      const newHero = await OfflineAPI.duplicateHero(hero.id);
      state.guildRoster.unshift(newHero);
      this.renderGuildHall();
      this.showToast(`${hero.name} dupliqué`, 'i-copy');
      this.playSound('click');
    } catch (e) { this.showToast('Erreur duplication', 'i-trash', true); }
  }

  async shareHero(hero) {
    const markdown = this.generateMarkdown(hero);
    if (navigator.share) {
      try { await navigator.share({ title: `${hero.name} — Fiche d'Aventurier`, text: markdown }); this.showToast('Partagé !', 'i-share'); } catch (e) { if (e.name !== 'AbortError') this.fallbackCopy(markdown); }
    } else { this.fallbackCopy(markdown); }
  }

  fallbackCopy(text) {
    navigator.clipboard.writeText(text).then(() => this.showToast('Copié dans le presse-papiers', 'i-copy')).catch(() => this.showToast('Échec de la copie', 'i-trash', true));
  }

  confirmDeleteHero(hero) {
    this.openConfirmModal(`Retirer ${hero.name} du registre ?`, 'Cette action est irréversible.', () => this.deleteHero(hero.id));
  }

  async deleteHero(id) {
    try {
      await OfflineAPI.deleteHero(id);
      state.guildRoster = state.guildRoster.filter(h => h.id !== id);
      this.renderGuildHall();
      this.showToast('Héros retiré du registre', 'i-trash');
      this.playSound('click');
    } catch (e) { this.showToast('Erreur suppression', 'i-trash', true); }
  }

  // ==========================================================================
  // MODALS
  // ==========================================================================
  openHeroModal(hero) {
    const modal = document.getElementById('modal-hero');
    const cls = GAME_DATA.CLASSES[hero.classKey];

    const visualDiv = document.getElementById('hero-modal-visual');
    visualDiv.innerHTML = '';
    if (this.avatar3D) {
      this.avatar3D.generateThumb(hero.appearance, hero.classKey, visualDiv, 200);
    }

    document.getElementById('hero-modal-title').textContent = hero.name;
    document.getElementById('hero-modal-sub').textContent = `${hero.title} • ${cls.name} • ${hero.guild}`;

    const statsHtml = Object.entries(hero.stats).map(([stat, val]) => {
      const colors = { social: '#78aaff', speed: '#e4bf70', channel: '#4dc397', chaos: '#b389ff' };
      const labels = { social: 'Mana Social', speed: 'Initiative', channel: 'Canal', chaos: 'Pivots' };
      return `<div class="hero-modal-stat"><strong style="--stat-color:${colors[stat]}">${val}</strong><span>${labels[stat]}</span></div>`;
    }).join('');
    document.getElementById('hero-modal-stats').innerHTML = statsHtml;

    document.getElementById('hero-modal-spells').innerHTML = `<div class="guild-spell guild-spell--sun"><svg><use href="#i-sun"/></svg><span><strong>Don :</strong> ${this.escapeHtml(hero.ultimate)}</span></div><div class="guild-spell guild-spell--skull"><svg><use href="#i-skull"/></svg><span><strong>Kryptonite :</strong> ${this.escapeHtml(hero.weakness)}</span></div><div class="guild-spell guild-spell--potion"><svg><use href="#i-flask"/></svg><span><strong>Potion :</strong> ${this.escapeHtml(hero.potion)}</span></div>`;

    const actions = document.getElementById('hero-modal-actions');
    actions.innerHTML = `
      <button class="btn btn-primary" data-action="load"><svg><use href="#i-edit"/></svg> Charger dans la Forge</button>
      <button class="btn btn-quiet" data-action="png"><svg><use href="#i-download"/></svg> Télécharger PNG</button>
      <button class="btn btn-quiet" data-action="duplicate"><svg><use href="#i-copy"/></svg> Dupliquer</button>
      <button class="btn btn-quiet" data-action="share"><svg><use href="#i-share"/></svg> Partager</button>
      ${!hero.isLegend ? '<button class="btn btn-danger" data-action="delete"><svg><use href="#i-trash"/></svg> Retirer</button>' : ''}
    `;
    actions.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'png') { this.openExportThemeDialog({ type: 'hero', hero, trigger: btn }); return; }
        this.closeModal('modal-hero');
        if (action === 'load') this.loadHeroToForge(hero);
        else if (action === 'duplicate') this.duplicateHero(hero);
        else if (action === 'share') this.shareHero(hero);
        else if (action === 'delete') this.confirmDeleteHero(hero);
      });
    });

    modal.showModal();
  }

  closeModal(id) { const modal = document.getElementById(id); if (modal) modal.close(); }

  openConfirmModal(title, text, onConfirm) {
    const modal = document.getElementById('modal-confirm');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = text;
    document.getElementById('confirm-ok').onclick = () => { onConfirm(); modal.close(); };
    document.getElementById('confirm-cancel').onclick = () => modal.close();
    modal.showModal();
  }

  // ==========================================================================
  // EXPORT / SHARE
  // ==========================================================================
  async exportPNG(theme = this.theme || 'dark') {
    const btn = document.getElementById('btn-export-png');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="spinning" style="animation:spin 1s linear infinite"><use href="#i-download"/></svg> Génération...';

    try {
      if (this.avatar3D) {
        const dataURL = await this.avatar3D.exportImage(state.hero, 1080, 1440, theme);
        const link = document.createElement('a');
        link.download = `${(state.hero.name || 'aventurier').replace(/\s+/g, '_')}_aetheria.png`;
        link.href = dataURL;
        link.click();
        this.showToast('Carte PNG exportée !', 'i-image');
        this.playSound('fanfare');
      }
    } catch (e) { console.error(e); this.showToast('Erreur lors de l\'export', 'i-trash', true); }
    finally { btn.disabled = false; btn.innerHTML = originalText; }
  }

  heroFileSlug(name) {
    return (name || 'aventurier')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'aventurier';
  }

  openExportThemeDialog(request = {}) {
    const modal = document.getElementById('modal-export-theme');
    if (!modal) return;
    const all = request.type === 'all';
    const count = all ? (state.guildRoster || []).length : 1;
    if (all && count === 0) { this.showToast('Aucune fiche à exporter.', 'i-users', true); return; }
    this.exportThemeRequest = request;
    const title = document.getElementById('export-theme-title');
    if (title) title.textContent = all ? `Exporter ${count} fiche${count > 1 ? 's' : ''}` : `Exporter ${request.hero ? request.hero.name : 'la fiche'}`;
    const sub = document.getElementById('export-theme-sub');
    if (sub) sub.textContent = 'Choisis le thème de la fiche PNG. Le thème de l’application restera inchangé.';
    const hint = document.getElementById('export-theme-count');
    if (hint) hint.textContent = all
      ? (count > 1 ? `${count} fichiers PNG seront regroupés dans un ZIP.` : 'Un fichier PNG 1080 × 1440 sera téléchargé.')
      : 'Un fichier PNG 1080 × 1440 sera téléchargé.';
    modal.querySelectorAll('[data-export-theme]').forEach(btn => btn.classList.toggle('is-current', btn.dataset.exportTheme === this.theme));
    modal.showModal();
    const preferred = modal.querySelector('[data-export-theme].is-current') || modal.querySelector('[data-export-theme]');
    preferred?.focus();
  }

  confirmExportTheme(theme) {
    const request = this.exportThemeRequest;
    this.exportThemeRequest = null;
    const modal = document.getElementById('modal-export-theme');
    if (modal) modal.close();
    try { localStorage.setItem('aetheria_export_theme', theme); } catch (e) { /* ignore */ }
    if (!request) return;
    if (request.type === 'all') this.exportAllGuildPNG(theme);
    else if (request.type === 'forge') this.exportPNG(theme);
    else if (request.hero) this.exportHeroPNG(request.hero, request.trigger, theme);
  }

  async exportHeroPNG(hero, trigger, theme = this.theme || 'dark') {
    if (!hero) { this.showToast('Fiche introuvable.', 'i-trash', true); return; }
    if (!this.avatar3D) { this.showToast('Export indisponible pour le moment.', 'i-trash', true); return; }
    const original = trigger ? trigger.innerHTML : '';
    if (trigger) trigger.disabled = true;
    try {
      if (trigger) trigger.innerHTML = '<svg class="spinning" style="animation:spin 1s linear infinite"><use href="#i-download"/></svg>';
      const dataURL = await this.avatar3D.exportImage(hero, 1080, 1440, theme);
      const link = document.createElement('a');
      link.download = `${this.heroFileSlug(hero.name)}_aetheria.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      link.remove();
      this.showToast('Fiche PNG téléchargée !', 'i-image');
      this.playSound('fanfare');
    } catch (error) {
      console.error('[Export fiche]', error);
      this.showToast('Export impossible. Réessaie.', 'i-trash', true);
    } finally {
      if (trigger) { trigger.disabled = false; trigger.innerHTML = original; }
    }
  }

  async exportAllGuildPNG(theme = this.theme || 'dark') {
    const heroes = [...(state.guildRoster || [])];
    const btn = document.getElementById('btn-export-all-guild');
    const original = btn ? btn.innerHTML : '';
    if (!heroes.length) { this.showToast('Aucune fiche à exporter.', 'i-users', true); return; }
    if (!this.avatar3D) { this.showToast('Export indisponible pour le moment.', 'i-trash', true); return; }

    const download = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    if (btn) btn.disabled = true;
    try {
      const files = [];
      for (let i = 0; i < heroes.length; i++) {
        const hero = heroes[i];
        if (btn) btn.innerHTML = `<svg class="spinning" style="animation:spin 1s linear infinite"><use href="#i-download"/></svg> ${i + 1}/${heroes.length}`;
        const dataURL = await this.avatar3D.exportImage(hero, 1080, 1440, theme);
        files.push({
          name: `${String(i + 1).padStart(2, '0')}_${this.heroFileSlug(hero.name)}_aetheria.png`,
          data: dataUrlToBytes(dataURL)
        });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      if (files.length === 1) {
        download(new Blob([files[0].data], { type: 'image/png' }), files[0].name);
        this.showToast('Fiche PNG exportée !', 'i-image');
      } else {
        download(createZip(files), `aetheria_fiches_${new Date().toISOString().slice(0, 10)}.zip`);
        this.showToast(`${files.length} fiches exportées en PNG (ZIP)`, 'i-download');
      }
      this.playSound('fanfare');
    } catch (error) {
      console.error('[Export fiches]', error);
      this.showToast('Export impossible. Réessaie.', 'i-trash', true);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
  }

  copyMarkdown() {
    const markdown = this.generateMarkdown(state.hero);
    navigator.clipboard.writeText(markdown).then(() => { this.showToast('Markdown copié !', 'i-copy'); this.playSound('click'); }).catch(() => this.showToast('Échec de la copie', 'i-trash', true));
  }

  generateMarkdown(hero) {
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
  // RANDOMIZERS
  // ==========================================================================
  randomizeAppearance() {
    const h = state.hero;

    // Only randomize appearance
    const races = GAME_DATA.RACES.map(r => r.id);
    const race = races[Math.floor(Math.random() * races.length)];
    const raceData = GAME_DATA.RACES.find(r => r.id === race);
    const skins = raceData?.skinTones || Object.keys(GAME_DATA.SKIN_TONES);

    h.appearance.race = race;
    h.appearance.skin = skins[Math.floor(Math.random() * skins.length)];
    h.appearance.build = GAME_DATA.BUILDS[Math.floor(Math.random() * GAME_DATA.BUILDS.length)].id;
    h.appearance.height = GAME_DATA.HEIGHTS[Math.floor(Math.random() * GAME_DATA.HEIGHTS.length)].id;
    h.appearance.posture = GAME_DATA.POSTURES[Math.floor(Math.random() * GAME_DATA.POSTURES.length)].id;
    h.appearance.face = GAME_DATA.FACE_SHAPES[Math.floor(Math.random() * GAME_DATA.FACE_SHAPES.length)].id;
    h.appearance.eyes = Object.keys(GAME_DATA.EYE_COLORS)[Math.floor(Math.random() * Object.keys(GAME_DATA.EYE_COLORS).length)];
    h.appearance.expression = GAME_DATA.EXPRESSIONS[Math.floor(Math.random() * GAME_DATA.EXPRESSIONS.length)].id;
    h.appearance.mark = GAME_DATA.MARKS[Math.floor(Math.random() * GAME_DATA.MARKS.length)].id;
    h.appearance.facialHair = GAME_DATA.FACIAL_HAIR[Math.floor(Math.random() * GAME_DATA.FACIAL_HAIR.length)].id;
    h.appearance.warpaint = GAME_DATA.WARPAINTS[Math.floor(Math.random() * GAME_DATA.WARPAINTS.length)].id;
    h.appearance.hairStyle = GAME_DATA.HAIRSTYLES[Math.floor(Math.random() * GAME_DATA.HAIRSTYLES.length)].id;
    h.appearance.hairColor = Object.keys(GAME_DATA.HAIR_COLORS)[Math.floor(Math.random() * Object.keys(GAME_DATA.HAIR_COLORS).length)];
    h.appearance.hairHighlight = GAME_DATA.HAIR_HIGHLIGHTS[Math.floor(Math.random() * GAME_DATA.HAIR_HIGHLIGHTS.length)].id;

    const outfits = GAME_DATA.OUTFITS[h.classKey] || [];
    h.appearance.outfit = outfits[Math.floor(Math.random() * outfits.length)]?.id || 'plate-gold';
    h.appearance.headgear = GAME_DATA.HEADGEAR[Math.floor(Math.random() * GAME_DATA.HEADGEAR.length)].id;
    h.appearance.artifact = GAME_DATA.ARTIFACTS[Math.floor(Math.random() * GAME_DATA.ARTIFACTS.length)].id;
    h.appearance.aura = GAME_DATA.AURAS[Math.floor(Math.random() * GAME_DATA.AURAS.length)].id;
    h.appearance.frame = GAME_DATA.FRAMES[Math.floor(Math.random() * GAME_DATA.FRAMES.length)].id;
    h.appearance.backdrop = GAME_DATA.BACKDROPS[Math.floor(Math.random() * GAME_DATA.BACKDROPS.length)].id;
    h.appearance.lighting = GAME_DATA.LIGHTINGS[Math.floor(Math.random() * GAME_DATA.LIGHTINGS.length)].id;
    h.appearance.particles = GAME_DATA.PARTICLES[Math.floor(Math.random() * GAME_DATA.PARTICLES.length)].id;

    this.renderAll();
    this.saveDraft();
    this.showToast('Apparence aléatoire générée !', 'i-shuffle');
    this.playSound('click');
  }

  rollFateDice() {
    this.playSound('diceRoll');

    // Visual feedback
    const diceBtns = [document.getElementById('btn-dice-bottom'), document.getElementById('btn-roll-dice')];
    diceBtns.forEach(btn => { if (btn) { btn.classList.add('rolling'); setTimeout(() => btn.classList.remove('rolling'), 800); } });

    // Only randomize appearance (not stats, class, grimoire)
    this.randomizeAppearance();
    this.showToast('Le Dé du Destin a parlé !', 'i-dice');
    this.saveDraft();
  }

  applyClassPreset() {
    const cls = GAME_DATA.CLASSES[state.hero.classKey];
    if (!cls) return;

    state.hero.stats = { ...cls.defaultStats };
    state.hero.appearance.race = cls.bodyType || 'human';
    state.hero.appearance.build = cls.build || 'average';
    state.hero.appearance.height = cls.height || 'average';
    state.hero.appearance.outfit = cls.outfitPreset;
    state.hero.appearance.aura = cls.id === 'paladin' ? 'gold' : cls.id === 'ranger' ? 'emerald' : cls.id === 'bard' ? 'violet' : 'cyan';
    state.hero.appearance.frame = cls.id === 'paladin' ? 'classic' : cls.id === 'ranger' ? 'nature' : cls.id === 'bard' ? 'ornate' : 'runic';

    this.renderAll();
    this.showToast(`Profil ${cls.name} appliqué`, 'i-sparkles');
    this.playSound('equip');
    this.saveDraft();
  }

  // ==========================================================================
  // SAVE / SYNC
  // ==========================================================================
  async saveHero() {
    const h = state.hero;
    if (!h.name.trim()) {
      this.showToast('Donne un nom à ton héros !', 'i-skull', true);
      const nameInput = document.getElementById('hero-name');
      if (nameInput) { nameInput.classList.add('is-invalid'); nameInput.focus(); nameInput.select(); }
      return;
    }
    if (!h.classKey) { this.showToast('Choisis une classe !', 'i-skull', true); return; }

    try {
      h.name = h.name.trim();
      const nameKey = h.name.toLocaleLowerCase('fr');
      const existingById = h.id ? state.guildRoster.find(r => r.id === h.id) : null;
      const existingByName = existingById
        ? null
        : state.guildRoster.find(r => String(r.name || '').trim().toLocaleLowerCase('fr') === nameKey);

      let savedHero;
      if (existingById) {
        savedHero = await OfflineAPI.updateHero(existingById.id, h);
      } else if (existingByName) {
        // Same name -> overwrite the existing hero instead of creating a duplicate.
        savedHero = await OfflineAPI.updateHero(existingByName.id, { ...h, id: existingByName.id });
      } else {
        savedHero = await OfflineAPI.createHero(h);
      }

      // Keep the current hero in sync (notably its server id) so a second save
      // updates the existing hero instead of creating a duplicate.
      if (savedHero && savedHero.id) state.hero = { ...state.hero, ...savedHero };

      // Update local roster
      const idx = state.guildRoster.findIndex(r => r.id === savedHero.id);
      if (idx >= 0) state.guildRoster[idx] = savedHero;
      else state.guildRoster.unshift(savedHero);

      this.showToast(idx >= 0 ? `${h.name} mis à jour` : `${h.name} inscrit au registre !`, idx >= 0 ? 'i-save' : 'i-save', false);
      this.playSound(idx >= 0 ? 'click' : 'fanfare');

      this.clearDraft();
      this.renderGuildHall();
      this.renderHeroCard();
      this.updateCompletionBadges();
    } catch (e) { console.error(e); this.showToast('Erreur sauvegarde', 'i-trash', true); }
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================
  setView(view) {
    state.currentView = view;
    document.querySelectorAll('[data-view]').forEach(v => { v.classList.toggle('is-active', v.dataset.view === view); v.hidden = v.dataset.view !== view; });
    document.querySelectorAll('button[data-view]').forEach(btn => { btn.classList.toggle('is-active', btn.dataset.view === view); btn.setAttribute('aria-selected', btn.dataset.view === view); });
    document.querySelectorAll('.bottom-tab').forEach(btn => { btn.classList.toggle('is-active', btn.dataset.view === view); });
    window.scrollTo(0, 0);
    document.title = view === 'forge' ? 'Aetheria · Forge' : view === 'dungeon' ? 'Aetheria · Donjon (MJ IA)' : 'Aetheria · Guilde';
    if (view === 'guild') this.renderGuildHall();
    if (view === 'dungeon') this.dungeonGame?.onShow();
  }

  setTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.editor-tab').forEach(btn => { const active = btn.dataset.tab === tab; btn.classList.toggle('is-active', active); btn.setAttribute('aria-selected', active); });
    document.querySelectorAll('.panel').forEach(panel => { const active = panel.id === `panel-${tab}`; panel.classList.toggle('is-active', active); panel.hidden = !active; });
    setTimeout(() => document.querySelector('.editor-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  setSubtab(subtab) { state.currentSubtab = subtab; this.renderSubtabs(); }

  setGuildFilter(filter) {
    state.currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(btn => { const active = btn.dataset.filter === filter; btn.classList.toggle('is-active', active); btn.setAttribute('aria-pressed', active); });
    this.renderGuildHall();
  }

  updateNavigation() {
    const count = state.guildRoster.length;
    const countEl = document.getElementById('guild-count');
    if (countEl) countEl.textContent = count;
  }

  updateCompletionBadges() {
    const h = state.hero;
    let completed = 0;
    const total = 7;
    if (h.name.trim()) completed++;
    if (h.guild.trim()) completed++;
    if (h.classKey) completed++;
    if (h.title.trim()) completed++;
    if (h.ultimate.trim()) completed++;
    if (h.weakness.trim()) completed++;
    if (h.potion.trim()) completed++;
    const percent = Math.round((completed / total) * 100);
    document.querySelectorAll('.completion-progress').forEach(circle => { const c = 2 * Math.PI * 20; circle.style.strokeDashoffset = c - (percent / 100) * c; });
    document.querySelectorAll('.completion-text').forEach(el => el.textContent = `${percent}%`);
    const progressTitle = document.getElementById('forge-progress-title');
    if (progressTitle) progressTitle.textContent = `Fiche à ${percent}%`;
    const progressHint = document.getElementById('forge-progress-hint');
    if (progressHint) {
      const missing = [];
      if (!h.name.trim()) missing.push('nom');
      if (!h.guild.trim()) missing.push('guilde');
      if (!h.title.trim()) missing.push('titre');
      if (!h.ultimate.trim() || !h.weakness.trim() || !h.potion.trim()) missing.push('grimoire');
      progressHint.textContent = missing.length ? `À compléter : ${missing.join(', ')}` : 'Prête à inscrire au registre';
    }
    const miniPct = document.getElementById('hero-mini-pct');
    if (miniPct) miniPct.textContent = `${percent}%`;
    const miniBar = document.getElementById('hero-mini-bar');
    if (miniBar) miniBar.style.width = `${percent}%`;

    const identityDone = !!(h.name.trim() && h.guild.trim() && h.classKey && h.title.trim());
    const grimoireDone = !!(h.ultimate.trim() && h.weakness.trim() && h.potion.trim());
    document.querySelectorAll('.editor-tab').forEach(tab => {
      if (tab.dataset.tab === 'identity') tab.classList.toggle('is-complete', identityDone);
      if (tab.dataset.tab === 'grimoire') tab.classList.toggle('is-complete', grimoireDone);
    });
  }

  updateSoundButton() {
    const btn = document.getElementById('sound-btn');
    const use = btn?.querySelector('svg use');
    if (state.soundEnabled) { use?.setAttribute('href', '#i-volume'); btn?.setAttribute('aria-label', 'Désactiver les sons'); }
    else { use?.setAttribute('href', '#i-mute'); btn?.setAttribute('aria-label', 'Activer les sons'); }
  }

  toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    state.settings.sound = state.soundEnabled;
    this.saveSettings();
    this.updateSoundButton();
    if (state.soundEnabled) this.playSound('click');
    this.showToast(state.soundEnabled ? 'Sons activés' : 'Sons coupés', state.soundEnabled ? 'i-volume' : 'i-mute');
  }

  // ==========================================================================
  // AUDIO
  // ==========================================================================
  initAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AC();
      document.body.addEventListener('click', () => { if (state.audioCtx?.state === 'suspended') state.audioCtx.resume(); }, { once: true });
    } catch (e) { console.warn('Audio init failed:', e); }
  }

  playSound(type) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const ctx = state.audioCtx; const now = ctx.currentTime;
    const sounds = {
      click: () => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(800, now); o.frequency.exponentialRampToValueAtTime(400, now + 0.08); g.gain.setValueAtTime(0.06, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.08); o.connect(g).connect(ctx.destination); o.start(now); o.stop(now + 0.08); },
      equip: () => { [660, 880, 1100].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.04); g.gain.setValueAtTime(0.04, now + i * 0.04); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12); o.connect(g).connect(ctx.destination); o.start(now + i * 0.04); o.stop(now + i * 0.04 + 0.12); }); },
      diceRoll: () => { for (let i = 0; i < 8; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.setValueAtTime(200 + Math.random() * 400, now + i * 0.03); g.gain.setValueAtTime(0.03, now + i * 0.03); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.02); o.connect(g).connect(ctx.destination); o.start(now + i * 0.03); o.stop(now + i * 0.03 + 0.02); } },
      fanfare: () => { const notes = [523.25, 659.25, 783.99, 1046.5]; notes.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, now + i * 0.1); g.gain.setValueAtTime(0.08, now + i * 0.1); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4); o.connect(g).connect(ctx.destination); o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4); }); }
    };
    if (sounds[type]) sounds[type]();
  }

  // ==========================================================================
  // TOAST
  // ==========================================================================
  showToast(message, iconId, isError = false) {
    const stack = document.getElementById('toast-stack');
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.innerHTML = `<svg class="toast-icon"><use href="#${iconId}"/></svg><span>${this.escapeHtml(message)}</span>`;
    stack.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); toast.addEventListener('animationend', () => toast.remove()); }, 4000);
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  attachEventListeners() {
    // View navigation
    document.querySelectorAll('button[data-view]').forEach(btn => btn.addEventListener('click', () => this.setView(btn.dataset.view)));

    // Editor tabs
    document.querySelectorAll('.editor-tab').forEach(btn => btn.addEventListener('click', () => this.setTab(btn.dataset.tab)));

    // Subtabs
    document.querySelectorAll('.subtab').forEach(btn => btn.addEventListener('click', () => this.setSubtab(btn.dataset.subtab)));

    // Guild filters
    document.querySelectorAll('.filter-chip').forEach(btn => btn.addEventListener('click', () => this.setGuildFilter(btn.dataset.filter)));

    // Search
    document.getElementById('guild-search')?.addEventListener('input', (e) => { state.searchQuery = e.target.value; this.renderGuildHall(); });

    // Class cards (delegated)
    document.getElementById('class-grid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.class-card');
      if (!card) return;
      this.selectClass(card.dataset.class);
    });
    document.getElementById('class-grid')?.addEventListener('keydown', (e) => {
      const card = e.target.closest('.class-card');
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });

    // Identity inputs
    ['hero-name', 'hero-guild', 'hero-title'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', (e) => {
        state.hero[id.replace('hero-', '')] = e.target.value;
        e.target.classList.remove('is-invalid');
        this.renderHeroCard();
        this.saveDraft();
      });
    });

    // Stat sliders
    ['social', 'speed', 'channel', 'chaos'].forEach(stat => {
      document.getElementById(`stat-${stat}`)?.addEventListener('input', (e) => {
        state.hero.stats[stat] = parseInt(e.target.value);
        this.renderAttributesPanel();
        this.renderHeroCard();
        this.saveDraft();
      });
    });

    // Grimoire textareas
    ['ultimate', 'weakness', 'potion'].forEach(field => {
      document.getElementById(`grimoire-${field}`)?.addEventListener('input', (e) => {
        state.hero[field] = e.target.value;
        this.updateMarkdownPreview();
        this.renderHeroCard();
        this.saveDraft();
      });
    });

    // Snippet chips
    document.querySelectorAll('.snippet-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.closest('.snippet-chips').dataset.target;
        const textarea = document.getElementById(target);
        const current = textarea.value;
        textarea.value = current ? current + ' ' + btn.dataset.text : btn.dataset.text;
        textarea.dispatchEvent(new Event('input'));
        this.playSound('click');
      });
    });

    // Main actions
    document.getElementById('btn-randomize')?.addEventListener('click', () => this.randomizeAppearance());
    document.getElementById('btn-apply-class-preset')?.addEventListener('click', () => this.applyClassPreset());
    document.getElementById('btn-export-png')?.addEventListener('click', () => this.openExportThemeDialog({ type: 'forge' }));
    document.getElementById('btn-export-all-guild')?.addEventListener('click', () => this.openExportThemeDialog({ type: 'all' }));
    document.querySelectorAll('[data-export-theme]').forEach(btn => btn.addEventListener('click', () => this.confirmExportTheme(btn.dataset.exportTheme)));
    document.getElementById('modal-export-theme')?.addEventListener('close', () => { this.exportThemeRequest = null; });
    document.getElementById('btn-save-hero')?.addEventListener('click', () => this.saveHero());
    document.getElementById('btn-save-hero-bottom')?.addEventListener('click', () => this.saveHero());
    document.querySelectorAll('[data-next-tab]').forEach(btn => btn.addEventListener('click', () => this.setTab(btn.dataset.nextTab)));
    document.getElementById('hero-mini-preview')?.addEventListener('click', () => {
      const src = document.getElementById('avatar-canvas-wrap-img')?.src;
      const img = document.getElementById('preview-avatar');
      if (img && src) img.src = src;
      const title = document.getElementById('preview-title');
      if (title) title.textContent = state.hero.name || 'Nouveau héros';
      const sub = document.getElementById('preview-sub');
      if (sub) {
        const cls = GAME_DATA.CLASSES[state.hero.classKey];
        sub.textContent = cls ? `${cls.name} · ${cls.role}` : 'Choisis une classe';
      }
      document.getElementById('modal-preview')?.showModal();
    });
    document.getElementById('btn-roll-dice')?.addEventListener('click', () => this.rollFateDice());
    document.getElementById('btn-dice-bottom')?.addEventListener('click', () => this.rollFateDice());
    document.getElementById('btn-random-appearance')?.addEventListener('click', () => this.randomizeAppearance());
    document.getElementById('btn-copy-markdown')?.addEventListener('click', () => this.copyMarkdown());
    document.getElementById('btn-share-hero')?.addEventListener('click', () => this.shareHero(state.hero));
    document.getElementById('btn-new-first-hero')?.addEventListener('click', () => { this.setView('forge'); this.createNewHero(); });
    document.getElementById('btn-back-forge')?.addEventListener('click', () => this.setView('forge'));

    // Sound
    document.getElementById('sound-btn')?.addEventListener('click', () => this.toggleSound());

    // Top-bar save: persist the current draft and confirm visually
    document.getElementById('save-btn')?.addEventListener('click', () => {
      this.saveDraft();
      const btn = document.getElementById('save-btn');
      if (btn) {
        btn.classList.add('is-saved');
        clearTimeout(this._saveBtnTimer);
        this._saveBtnTimer = setTimeout(() => btn.classList.remove('is-saved'), 1400);
      }
      this.showToast('Brouillon sauvegardé', 'i-check');
      this.playSound('click');
    });

    // Protocol modal
    document.getElementById('protocol-btn')?.addEventListener('click', () => document.getElementById('modal-protocol').showModal());
    document.getElementById('protocol-close')?.addEventListener('click', () => document.getElementById('modal-protocol').close());
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => btn.closest('dialog').close()));

    // Modal backdrop click
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }));

    // Artifact badge: name on hover (desktop) and on tap (mobile)
    document.getElementById('avatar-canvas-wrap')?.addEventListener('click', (e) => {
      const badge = e.target.closest('.avatar-artifact');
      if (badge && badge.dataset.tooltip) this.showToast(badge.dataset.tooltip, 'i-gem');
    });

    // Escape key
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('dialog[open]').forEach(d => d.close()); });

    // Auto-save draft
    let draftTimer;
    document.addEventListener('input', () => { clearTimeout(draftTimer); draftTimer = setTimeout(() => this.saveDraft(), 1000); });
  }

  selectClass(classKey) {
    state.hero.classKey = classKey;
    const cls = GAME_DATA.CLASSES[classKey];
    state.hero.stats = { ...cls.defaultStats };
    state.hero.appearance.race = cls.bodyType || 'human';
    state.hero.appearance.build = cls.build || 'average';
    state.hero.appearance.height = cls.height || 'average';
    state.hero.appearance.outfit = cls.outfitPreset;
    state.hero.appearance.aura = cls.id === 'paladin' ? 'gold' : cls.id === 'ranger' ? 'emerald' : cls.id === 'bard' ? 'violet' : 'cyan';
    this.renderAll();
    this.saveDraft();
    this.playSound('equip');
  }

  // ==========================================================================
  // PWA
  // ==========================================================================
  setupPWA() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-btn').style.display = 'flex'; });
    document.getElementById('install-btn')?.addEventListener('click', async () => { if (!deferredPrompt) return; await deferredPrompt.prompt(); if ((await deferredPrompt.userChoice).outcome === 'accepted') this.showToast('Application installée !', 'i-install'); deferredPrompt = null; document.getElementById('install-btn').style.display = 'none'; });
    window.addEventListener('appinstalled', () => { document.getElementById('install-btn').style.display = 'none'; deferredPrompt = null; });
  }

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.saveHero(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); this.openExportThemeDialog({ type: 'forge' }); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); this.rollFateDice(); }
      if (e.key >= '1' && e.key <= '4') { const tabs = ['identity', 'appearance', 'attributes', 'grimoire']; this.setTab(tabs[parseInt(e.key) - 1]); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { const subtabs = ['body', 'face', 'hair', 'gear', 'backdrop']; const i = subtabs.indexOf(state.currentSubtab); if (i !== -1) this.setSubtab(subtabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + subtabs.length) % subtabs.length]); }
    });
  }
}

// Export for inline handlers
window.App = App;