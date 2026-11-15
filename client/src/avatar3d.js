// Aetheria — Portrait generator using DiceBear "avataaars"
// Produces recognizable, stylised human portraits for each hero.
import { GAME_DATA } from './data.js';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';

const PREVIEW_SIZE = 512;
const FONT_TITLE = '"Cinzel Decorative", "Cinzel", Georgia, serif';
const FONT_RPG = '"Cinzel", Georgia, serif';
const FONT_UI = '"Manrope", system-ui, sans-serif';

export class Avatar3D {
  constructor() {
    this.container = null;
    this.currentAppearance = null;
    this.currentClass = 'paladin';
    this.lastSvg = '';
    this._thumbCache = new Map();
  }

  init(container, options = {}) {
    this.container = container;
    container.innerHTML = '';

    const img = document.createElement('img');
    img.setAttribute('class', 'avatar-svg');
    img.id = 'avatar-canvas-wrap-img';
    img.alt = 'Portrait du héros';
    img.decoding = 'async';
    if (options.width) img.width = options.width;
    if (options.height) img.height = options.height;
    container.appendChild(img);
    return img;
  }

  generate(appearance, classKey) {
    if (!this.container) return null;
    this.currentAppearance = appearance;
    this.currentClass = classKey || 'paladin';

    const svg = this._buildSvg(appearance, this.currentClass);
    this.lastSvg = svg;

    const img = this.container.querySelector('#avatar-canvas-wrap-img');
    if (img) img.src = svgToDataUri(svg);

    this._applyPresentation(appearance, this.currentClass, img);
    return img;
  }

  // Apply every visual option to the portrait frame (backdrop, aura, frame, light,
  // silhouette, particles, artifact).
  _applyPresentation(appearance, classKey, img) {
    const c = this.container;
    if (!c) return;

    const cls = GAME_DATA.CLASSES[classKey] || GAME_DATA.CLASSES.paladin;
    const auraDef = GAME_DATA.AURAS.find(a => a.id === appearance.aura);
    const backdropDef = GAME_DATA.BACKDROPS.find(b => b.id === appearance.backdrop);
    const auraColor = auraDef && auraDef.color !== 'transparent' ? auraDef.color : cls.color;
    const backdropColor = backdropDef?.color || '#3a3444';
    const backdropBg = BACKDROP_GRADIENTS[appearance.backdrop] || BACKDROP_GRADIENTS.fortress;
    const auraAlpha = auraDef && auraDef.id === 'none' ? 0.10 : 0.26;

    c.style.background = [
      `radial-gradient(circle at 50% 30%, ${hexToRgba(auraColor, auraAlpha)} 0%, rgba(8,7,11,0) 62%)`,
      `radial-gradient(circle at 50% 108%, ${hexToRgba(backdropColor, 0.22)} 0%, rgba(8,7,11,0) 58%)`,
      backdropBg
    ].join(', ');

    const frame = FRAME_STYLES[appearance.frame] || FRAME_STYLES.classic;
    c.style.border = frame.border;
    c.style.boxShadow = frame.shadow;

    if (img) {
      img.style.filter = LIGHTING_FILTERS[appearance.lighting] || 'none';
      img.style.transformOrigin = '50% 100%';
      img.style.transform = avatarTransform(appearance);
    }

    this._renderParticles(c, appearance.particles);
    this._renderArtifact(c, appearance.artifact);
  }

  _renderParticles(container, kind) {
    const old = container.querySelector('.avatar-particles');
    if (old) old.remove();
    if (!kind || kind === 'none') return;

    const layer = document.createElement('div');
    layer.className = 'avatar-particles';
    layer.dataset.kind = kind;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.style.left = `${(Math.random() * 100).toFixed(2)}%`;
      s.style.bottom = `${(Math.random() * 82).toFixed(2)}%`;
      s.style.animationDelay = `${(Math.random() * 1.5).toFixed(2)}s`;
      s.style.animationDuration = `${(4 + Math.random() * 4).toFixed(2)}s`;
      s.style.setProperty('--s', `${(2 + Math.random() * 5).toFixed(1)}px`);
      layer.appendChild(s);
    }
    container.appendChild(layer);
  }

  _renderArtifact(container, artifactId) {
    const old = container.querySelector('.avatar-artifact');
    if (old) old.remove();
    const icon = ARTIFACT_ICONS[artifactId];
    if (!icon) return;

    const def = GAME_DATA.ARTIFACTS.find(a => a.id === artifactId);
    const badge = document.createElement('div');
    badge.className = 'avatar-artifact';
    badge.dataset.tooltip = def ? def.name : artifactId;
    badge.setAttribute('aria-label', `Artefact : ${def ? def.name : artifactId}`);
    badge.innerHTML = `<svg><use href="#${icon}"/></svg>`;
    container.appendChild(badge);
  }

  // Renders an avatar straight into another container (guild hall / modal).
  generateThumb(appearance, classKey, target, size = 128) {
    if (!target) return;
    const clsKey = classKey || 'paladin';
    const clsDef = GAME_DATA.CLASSES[clsKey] || GAME_DATA.CLASSES.paladin;
    const svg = this._buildSvg(appearance, clsKey);
    const uri = svgToDataUri(svg);

    target.innerHTML = '';
    const auraDef = GAME_DATA.AURAS.find(a => a.id === appearance.aura);
    const backdropDef = GAME_DATA.BACKDROPS.find(b => b.id === appearance.backdrop);
    const auraColor = auraDef && auraDef.color !== 'transparent' ? auraDef.color : clsDef.color;
    target.style.background = `radial-gradient(circle at 50% 30%, ${hexToRgba(auraColor, 0.22)} 0%, rgba(8,7,11,0) 62%), ${BACKDROP_GRADIENTS[appearance.backdrop] || BACKDROP_GRADIENTS.fortress}`;

    const img = document.createElement('img');
    img.className = 'avatar-svg avatar-svg--thumb';
    img.alt = 'Portrait du héros';
    img.decoding = 'async';
    img.src = uri;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    target.appendChild(img);
    return img;
  }

  // Small zoomed head preview used by the hairstyle picker.
  hairThumb(appearance, hairStyle, size = 128) {
    const key = `${hairStyle}|${appearance.hairColor}|${appearance.hairHighlight}|${appearance.skin}|${appearance.race}`;
    if (this._thumbCache.has(key)) return this._thumbCache.get(key);

    const preview = {
      ...appearance,
      hairStyle,
      headgear: appearance.headgear === 'glasses' ? 'glasses' : 'none',
      facialHair: 'none'
    };
    const options = this._buildOptions(preview, this.currentClass);
    options.size = size;
    options.width = size;
    options.height = size;
    const uri = svgToDataUri(createAvatar(avataaars, options).toString());
    this._thumbCache.set(key, uri);
    return uri;
  }

  // Build a full 1080x1440 hero card and return a PNG data URL.
  async exportImage(hero, width = 1080, height = 1440, theme = 'dark') {
    const W = width;
    const H = height;
    const light = theme === 'light';
    const cls = GAME_DATA.CLASSES[hero.classKey] || GAME_DATA.CLASSES.paladin;

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }

    const svg = this._buildSvg(hero.appearance, hero.classKey || 'paladin');
    const avatar = await loadImage(svgToDataUri(svg));

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ---- Background ----
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (light) {
      bg.addColorStop(0, '#fffaf1');
      bg.addColorStop(0.55, '#f5ecdc');
      bg.addColorStop(1, '#eadfc9');
    } else {
      bg.addColorStop(0, '#15121d');
      bg.addColorStop(0.55, '#0c0b12');
      bg.addColorStop(1, '#08070b');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const auraDef = GAME_DATA.AURAS.find(a => a.id === hero.appearance.aura);
    const backdropDef = GAME_DATA.BACKDROPS.find(b => b.id === hero.appearance.backdrop);
    const auraColor = auraDef && auraDef.color !== 'transparent' ? auraDef.color : cls.color;
    const backdropColor = backdropDef?.color || cls.color;

    const aura = ctx.createRadialGradient(W / 2, H * 0.33, 30, W / 2, H * 0.33, W * 0.66);
    aura.addColorStop(0, hexToRgba(auraColor, light ? 0.2 : 0.32));
    aura.addColorStop(0.45, hexToRgba(auraColor, light ? 0.06 : 0.10));
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);

    const backGlow = ctx.createRadialGradient(W / 2, H * 1.02, 20, W / 2, H * 1.02, W * 0.7);
    backGlow.addColorStop(0, hexToRgba(backdropColor, light ? 0.14 : 0.22));
    backGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = backGlow;
    ctx.fillRect(0, 0, W, H);

    // ---- Ornamental frame ----
    roundRect(ctx, 34, 34, W - 68, H - 68, 30);
    ctx.lineWidth = 3;
    ctx.strokeStyle = light ? 'rgba(138,100,32,.8)' : 'rgba(201,168,76,.8)';
    ctx.stroke();

    roundRect(ctx, 52, 52, W - 104, H - 104, 22);
    ctx.lineWidth = 1;
    ctx.strokeStyle = light ? 'rgba(138,100,32,.3)' : 'rgba(201,168,76,.28)';
    ctx.stroke();

    // Corner diamonds
    drawDiamond(ctx, W / 2, 34, 9, '#e4bf70');
    drawDiamond(ctx, W / 2, H - 34, 9, '#e4bf70');

    // ---- Avatar ----
    const size = W * 0.58;
    const ax = (W - size) / 2;
    const ay = H * 0.05;
    const cx = W / 2;
    const cy = ay + size / 2;
    const radius = size / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const disc = ctx.createRadialGradient(cx, ay + size * 0.38, 10, cx, cy, radius);
    disc.addColorStop(0, light ? '#fffdf7' : '#221d30');
    disc.addColorStop(1, light ? '#eadfc9' : '#0a0910');
    ctx.fillStyle = disc;
    ctx.fillRect(ax, ay, size, size);
    ctx.drawImage(avatar, ax, ay, size, size);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = hexToRgba(light ? shadeHex(cls.color, -0.32) : cls.color, 0.9);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 9, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = light ? 'rgba(138,100,32,.55)' : 'rgba(201,168,76,.45)';
    ctx.stroke();

    // ---- Class label ----
    let y = ay + size + 50;
    ctx.textAlign = 'center';
    ctx.fillStyle = light ? shadeHex(cls.color, -0.38) : cls.color;
    ctx.font = `700 24px ${FONT_RPG}`;
    drawSpacedText(ctx, `${cls.name.toUpperCase()}  •  ${cls.role.toUpperCase()}`, cx, y, 4);

    // ---- Name ----
    y += 68;
    ctx.fillStyle = light ? '#241f18' : '#f5d99e';
    ctx.font = `800 62px ${FONT_TITLE}`;
    ctx.fillText(fitText(ctx, hero.name || 'Aventurier', W - 200), cx, y);

    // ---- Title & guild ----
    y += 40;
    ctx.fillStyle = light ? '#4a3f30' : '#d6cdbf';
    ctx.font = `italic 29px ${FONT_RPG}`;
    ctx.fillText(fitText(ctx, hero.title || cls.spec, W - 220), cx, y);

    y += 32;
    ctx.fillStyle = light ? '#6b5f4e' : '#9f9588';
    ctx.font = `500 22px ${FONT_UI}`;
    ctx.fillText(hero.guild || 'Sans guilde', cx, y);

    // ---- Divider ----
    y += 30;
    const lineW = W * 0.5;
    const grad = ctx.createLinearGradient(cx - lineW / 2, 0, cx + lineW / 2, 0);
    grad.addColorStop(0, 'rgba(201,168,76,0)');
    grad.addColorStop(0.5, light ? 'rgba(138,100,32,.8)' : 'rgba(201,168,76,.8)');
    grad.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - lineW / 2, y);
    ctx.lineTo(cx + lineW / 2, y);
    ctx.stroke();
    drawDiamond(ctx, cx, y, 6, light ? '#8a6320' : '#e4bf70');

    // ---- Stats ----
    y += 32;
    const stats = [
      { key: 'social', label: 'SOCIAL', color: light ? '#2f5f9e' : '#78aaff' },
      { key: 'speed', label: 'INIT.', color: light ? '#8a6320' : '#e4bf70' },
      { key: 'channel', label: 'CANAL', color: light ? '#2f7d5b' : '#4dc397' },
      { key: 'chaos', label: 'PIVOTS', color: light ? '#6b4fa8' : '#b389ff' },
    ];
    const colW = (W - 180) / 4;
    const startX = 90 + colW / 2;
    stats.forEach((s, i) => {
      const x = startX + i * colW;
      const val = (hero.stats && hero.stats[s.key]) || 0;
      ctx.fillStyle = s.color;
      ctx.font = `800 54px ${FONT_RPG}`;
      ctx.fillText(String(val), x, y);
      ctx.fillStyle = light ? '#6b5f4e' : '#9f9588';
      ctx.font = `700 18px ${FONT_UI}`;
      drawSpacedText(ctx, s.label, x, y + 34, 2);
    });

    // ---- Grimoire ----
    y += 66;
    const spells = [
      { label: 'DON ULTIME', text: hero.ultimate || '—', color: light ? '#8a6320' : '#e4bf70' },
      { label: 'KRYPTONITE', text: hero.weakness || '—', color: light ? '#a33d34' : '#d46a61' },
      { label: 'POTION', text: hero.potion || '—', color: light ? '#2f7c8f' : '#5ccde2' },
    ];
    const rowH = 60;
    spells.forEach((s) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = s.color;
      ctx.font = `700 19px ${FONT_UI}`;
      drawSpacedText(ctx, s.label, 96, y, 2);
      ctx.fillStyle = light ? '#3c3428' : '#d6cdbf';
      ctx.font = `500 25px ${FONT_UI}`;
      const line = fitText(ctx, s.text, W - 200);
      ctx.fillText(line, 96, y + 29);
      y += rowH + 8;
    });

    // ---- Footer ----
    ctx.textAlign = 'center';
    ctx.fillStyle = light ? 'rgba(90,76,56,.65)' : 'rgba(159,149,136,.6)';
    ctx.font = `500 19px ${FONT_UI}`;
    drawSpacedText(ctx, 'FORGÉ DANS LA FORGE D\'AETHERIA', cx, H - 66, 3);

    return canvas.toDataURL('image/png');
  }

  // ----------------------------------------------------------------------
  // SVG generation
  // ----------------------------------------------------------------------

  _buildSvg(appearance, classKey) {
    const options = this._buildOptions(appearance, classKey);
    const avatar = createAvatar(avataaars, options);
    return this._decorateSvg(avatar.toString(), appearance);
  }

  _buildOptions(appearance, classKey) {
    const cls = GAME_DATA.CLASSES[classKey] || GAME_DATA.CLASSES.paladin;
    const skin = stripHash(GAME_DATA.SKIN_TONES[appearance.skin]?.base) || 'edb98a';
    const hairBase = stripHash(GAME_DATA.HAIR_COLORS[appearance.hairColor]?.base) || '2c1b18';
    const highlight = GAME_DATA.HAIR_HIGHLIGHTS.find(h => h.id === appearance.hairHighlight && h.color !== 'transparent');
    const hair = highlight ? mixHex(hairBase, stripHash(highlight.color), 0.35) : hairBase;

    const top = this._mapTop(appearance);
    const glasses = appearance.headgear === 'glasses' ? ['prescription01'] : [];
    const facial = this._mapFacialHair(appearance.facialHair);

    return {
      // Deterministic seed → same hero always looks the same.
      seed: `${classKey}|${appearance.race}|${appearance.skin}|${appearance.hairStyle}|${appearance.hairColor}|${appearance.expression}|${appearance.headgear}|${appearance.facialHair}`,
      size: PREVIEW_SIZE,
      scale: 100,
      backgroundType: 'solid',
      backgroundColor: [], // transparent background, CSS provides the glow
      style: ['default'],
      base: ['default'],
      top: top.value,
      topProbability: top.probability,
      hairColor: [hair],
      hatColor: [top.hatColor || '262e33'],
      skinColor: [skin],
      eyes: this._mapEyes(appearance.expression),
      eyebrows: this._mapEyebrows(appearance.expression),
      mouth: this._mapMouth(appearance.expression),
      facialHair: facial.value,
      facialHairProbability: facial.probability,
      facialHairColor: [hair],
      accessories: glasses,
      accessoriesProbability: glasses.length ? 100 : 0,
      clothing: this._mapClothing(appearance.outfit),
      clothesColor: [this._mapClothingColor(appearance.outfit, cls)],
      clothingGraphic: ['diamond'],
      nose: ['default'],
    };
  }

  _mapTop(appearance) {
    // Headgear is drawn as a custom overlay (see HEADGEAR_OVERLAYS) so that it
    // never replaces the chosen hairstyle. DiceBear's `top` only accepts either
    // hair OR a hat, which is why hats used to make the hair disappear.
    const hairstyleMap = {
      'buzz': 'shortFlat',
      'crew': 'theCaesar',
      'textured-crop': 'shortWaved',
      'side-part': 'theCaesarAndSidePart',
      'pompadour': 'shortRound',
      'quiff': 'shortCurly',
      'messy-short': 'shaggy',
      'curly-short': 'curly',
      'afro-short': 'fro',
      'medium-messy': 'shaggyMullet',
      'shoulder-length': 'longButNotTooLong',
      'long-straight': 'straight01',
      'long-wavy': 'straightAndStrand',
      'long-curly': 'curvy',
      'braids': 'dreads01',
      'dreads': 'dreads',
      'topknot': 'bun',
      'half-up': 'bob',
      'ponytail-high': 'bob',
      'ponytail-low': 'bob',
      'bun': 'bun',
      'mohawk': 'shavedSides',
      'faux-hawk': 'shortWaved',
      'wolf-cut': 'shaggyMullet',
      'shag': 'shaggy',
      'asymmetrical': 'miaWallace',
    };

    if (appearance.hairStyle === 'bald') {
      return { value: [], probability: 0 };
    }
    return {
      value: [hairstyleMap[appearance.hairStyle] || 'theCaesar'],
      probability: 100,
    };
  }

  _mapEyes(expression) {
    const map = {
      neutral: ['default'],
      determined: ['default'],
      smirk: ['side'],
      kind: ['happy'],
      stern: ['squint'],
      curious: ['surprised'],
      weary: ['closed'],
      fierce: ['squint'],
      dreamy: ['closed'],
      cunning: ['squint'],
    };
    return map[expression] || ['default'];
  }

  _mapEyebrows(expression) {
    const map = {
      neutral: ['defaultNatural'],
      determined: ['raisedExcitedNatural'],
      smirk: ['raisedExcitedNatural'],
      kind: ['defaultNatural'],
      stern: ['frownNatural'],
      curious: ['raisedExcitedNatural'],
      weary: ['sadConcernedNatural'],
      fierce: ['angryNatural'],
      dreamy: ['flatNatural'],
      cunning: ['upDownNatural'],
    };
    return map[expression] || ['defaultNatural'];
  }

  _mapMouth(expression) {
    const map = {
      neutral: ['default'],
      determined: ['serious'],
      smirk: ['twinkle'],
      kind: ['smile'],
      stern: ['serious'],
      curious: ['disbelief'],
      weary: ['sad'],
      fierce: ['grimace'],
      dreamy: ['twinkle'],
      cunning: ['smile'],
    };
    return map[expression] || ['default'];
  }

  _mapFacialHair(facialHair) {
    const map = {
      'stubble': ['beardLight'],
      'goatee': ['moustacheFancy'],
      'beard-short': ['beardMedium'],
      'beard-full': ['beardMajestic'],
      'beard-braided': ['beardMajestic'],
      'mustache': ['moustacheFancy'],
      'mustache-handlebar': ['moustacheMagnum'],
      'sideburns': ['beardLight'],
    };
    if (!facialHair || facialHair === 'none' || !map[facialHair]) {
      return { value: [], probability: 0 };
    }
    return { value: map[facialHair], probability: 100 };
  }

  _mapClothing(outfit) {
    const o = outfit || '';
    if (o.startsWith('plate') || o === 'half-plate' || o === 'crusader') return ['blazerAndSweater'];
    if (o.startsWith('leather') || o === 'studded' || o === 'ranger-dark') return ['shirtCrewNeck'];
    if (o === 'cloak-hood') return ['hoodie'];
    if (o === 'wild') return ['overall'];
    if (o.startsWith('velvet') || o === 'doublet-gold') return ['collarAndSweater'];
    if (o === 'harlequin') return ['graphicShirt'];
    if (o === 'minstrel') return ['shirtScoopNeck'];
    if (o.startsWith('apron') || o === 'apron-heavy') return ['shirtCrewNeck'];
    if (o === 'robe-alchemist') return ['overall'];
    if (o === 'coat-long') return ['blazerAndSweater'];
    if (o === 'scholar') return ['collarAndSweater'];
    return ['shirtCrewNeck'];
  }

  _mapClothingColor(outfit, cls) {
    const colors = {
      'plate-gold': 'b8963e', 'plate-white': 'e6e6e6', 'plate-black': '262e33',
      'plate-ornate': '8a6f2a', 'half-plate': '6b7280', 'crusader': 'a03030',
      'leather-green': '3f6b3f', 'leather-brown': '6b4a2e', 'cloak-hood': '3a3f2e',
      'studded': '4a4038', 'ranger-dark': '24282e', 'wild': '5a4a30',
      'velvet-red': 'a03050', 'velvet-blue': '3a4e8a', 'velvet-purple': '6a3a8a',
      'doublet-gold': 'b8963e', 'harlequin': '8a3a6a', 'minstrel': '7a5a3a',
      'apron-leather': '6b4a2e', 'apron-cloth': '8a8270', 'robe-alchemist': '2e5a6a',
      'coat-long': '3a3f4a', 'apron-heavy': '4a4038', 'scholar': '4a4a5a'
    };
    return colors[outfit] || stripHash(cls.color) || '5199e4';
  }

  // Inject marks, warpaint and eye colour into the generated SVG.
  _decorateSvg(svg, appearance) {
    const parts = [];

    // Eye colour (only when the eyes are open)
    const eyeColor = GAME_DATA.EYE_COLORS[appearance.eyes]?.iris;
    const openEyes = ['neutral', 'determined', 'smirk', 'curious', 'stern', 'fierce', 'cunning'];
    if (eyeColor && openEyes.includes(appearance.expression)) {
      parts.push(
        `<g opacity=".9"><circle cx="114" cy="112" r="4" fill="${eyeColor}"/>` +
        `<circle cx="166" cy="112" r="4" fill="${eyeColor}"/></g>`
      );
    }

    // Facial marks
    switch (appearance.mark) {
      case 'scar-eye':
        parts.push('<path d="M99 99 L120 122" stroke="#b06a5a" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>');
        break;
      case 'scar-cheek':
        parts.push('<path d="M169 118 L183 137" stroke="#b06a5a" stroke-width="2" stroke-linecap="round" opacity=".8"/>');
        break;
      case 'scar-lip':
        parts.push('<path d="M150 141 L159 147" stroke="#b06a5a" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>');
        break;
      case 'freckles':
        parts.push(
          `<g fill="#a5673f" opacity=".55">` +
          `<circle cx="105" cy="126" r="1.4"/><circle cx="112" cy="131" r="1.2"/><circle cx="99" cy="132" r="1.2"/>` +
          `<circle cx="174" cy="126" r="1.4"/><circle cx="181" cy="131" r="1.2"/><circle cx="168" cy="132" r="1.2"/>` +
          `</g>`
        );
        break;
      case 'moles':
        parts.push('<g fill="#6b4a3a" opacity=".7"><circle cx="112" cy="128" r="1.2"/><circle cx="170" cy="125" r="1.1"/><circle cx="160" cy="138" r="1"/></g>');
        break;
      case 'rune-forehead':
        parts.push('<path d="M140 64 L146 72 L140 80 L134 72 Z" fill="none" stroke="#7ad7ff" stroke-width="1.8" opacity=".9"/>');
        break;
      case 'rune-cheek':
        parts.push('<path d="M106 128 L112 122 L118 128 M112 122 v12" fill="none" stroke="#7ad7ff" stroke-width="1.6" opacity=".85"/>');
        break;
      case 'tattoo-face':
        parts.push('<g fill="none" stroke="#284a5a" stroke-width="1.6" opacity=".75"><path d="M100 120 q10 6 0 14"/><path d="M106 118 q10 6 0 16"/><path d="M180 120 q-10 6 0 14"/><path d="M174 118 q-10 6 0 16"/></g>');
        break;
      case 'vitiligo':
        parts.push('<g fill="#f0e8dc" opacity=".28"><ellipse cx="108" cy="122" rx="10" ry="7"/><ellipse cx="172" cy="130" rx="8" ry="6"/><ellipse cx="140" cy="84" rx="12" ry="6"/></g>');
        break;
      case 'warpaint':
        parts.push('<g stroke="#b03030" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M98 122 L116 128"/><path d="M98 129 L116 135"/><path d="M182 122 L164 128"/><path d="M182 129 L164 135"/></g>');
        break;
    }

    // Warpaint layer
    switch (appearance.warpaint) {
      case 'tribal-lines':
        parts.push('<g stroke="#c23b2e" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M98 120 L118 126"/><path d="M98 127 L118 133"/><path d="M182 120 L162 126"/><path d="M182 127 L162 133"/></g>');
        break;
      case 'eye-mask':
        parts.push('<path d="M92 104 q48 -16 96 0 v14 q-48 14 -96 0 Z" fill="#141020" opacity=".68"/>');
        break;
      case 'forehead-mark':
        parts.push('<path d="M140 62 v18 M131 71 h18" stroke="#e4bf70" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>');
        break;
      case 'full-face':
        parts.push('<ellipse cx="140" cy="94" rx="52" ry="58" fill="#b03030" opacity=".16"/>');
        break;
      case 'clown':
        parts.push('<circle cx="140" cy="128" r="7" fill="#d94a4a" opacity=".85"/><circle cx="112" cy="132" r="6" fill="#d94a4a" opacity=".35"/><circle cx="168" cy="132" r="6" fill="#d94a4a" opacity=".35"/>');
        break;
      case 'geometric':
        parts.push('<g fill="none" stroke="#5cdbe2" stroke-width="1.8" opacity=".8"><path d="M98 118 L118 124 L98 132"/><path d="M182 118 L162 124 L182 132"/><path d="M132 66 L140 74 L148 66"/></g>');
        break;
      case 'glitter':
        parts.push('<g fill="#f5d99e" opacity=".9"><circle cx="104" cy="120" r="1.6"/><circle cx="112" cy="128" r="1.1"/><circle cx="176" cy="122" r="1.6"/><circle cx="168" cy="130" r="1.1"/><circle cx="140" cy="76" r="1.4"/></g>');
        break;
    }

    // Headgear overlay — drawn on top so the hairstyle stays visible underneath.
    const gear = HEADGEAR_OVERLAYS[appearance.headgear];
    if (gear) parts.push(gear);

    if (parts.length === 0) return svg;
    return svg.replace('</svg>', `<g pointer-events="none">${parts.join('')}</g></svg>`);
  }
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Presentation helpers
// ----------------------------------------------------------------------

const BACKDROP_GRADIENTS = {
  fortress: 'linear-gradient(180deg, #2a2731 0%, #14121a 55%, #08070b 100%)',
  crypt: 'linear-gradient(180deg, #241a33 0%, #120d1c 55%, #08070b 100%)',
  forest: 'linear-gradient(180deg, #14241a 0%, #0b130e 55%, #08070b 100%)',
  tavern: 'linear-gradient(180deg, #2a1a10 0%, #170e08 55%, #08070b 100%)',
  lab: 'linear-gradient(180deg, #0f2630 0%, #091419 55%, #08070b 100%)',
  mountain: 'linear-gradient(180deg, #243244 0%, #101722 55%, #08070b 100%)',
  desert: 'linear-gradient(180deg, #33260f 0%, #1b1408 55%, #08070b 100%)',
  void: 'linear-gradient(180deg, #1a1026 0%, #0d0814 55%, #08070b 100%)',
  library: 'linear-gradient(180deg, #2a2013 0%, #171008 55%, #08070b 100%)',
  battlefield: 'linear-gradient(180deg, #2a1010 0%, #170808 55%, #08070b 100%)'
};

const FRAME_STYLES = {
  classic: { border: '1px solid rgba(201,168,76,.45)', shadow: 'inset 0 0 0 1px rgba(201,168,76,.12), 0 8px 32px rgba(0,0,0,.55)' },
  ornate: { border: '3px double rgba(228,191,112,.75)', shadow: 'inset 0 0 0 4px rgba(8,7,11,.75), inset 0 0 0 5px rgba(228,191,112,.35), 0 10px 36px rgba(0,0,0,.6)' },
  runic: { border: '1px solid rgba(92,219,226,.7)', shadow: 'inset 0 0 18px rgba(92,219,226,.22), 0 0 18px rgba(92,219,226,.25)' },
  nature: { border: '1px solid rgba(101,194,154,.65)', shadow: 'inset 0 0 18px rgba(101,194,154,.16), 0 0 16px rgba(101,194,154,.18)' },
  dark: { border: '1px solid #1e1b26', shadow: 'inset 0 0 40px rgba(0,0,0,.8), 0 10px 28px rgba(0,0,0,.7)' },
  minimal: { border: '1px solid rgba(255,255,255,.08)', shadow: 'none' },
  parchment: { border: '2px solid rgba(214,180,120,.5)', shadow: 'inset 0 0 28px rgba(214,180,120,.12), 0 8px 26px rgba(0,0,0,.5)' },
  metal: { border: '2px solid rgba(180,190,205,.55)', shadow: 'inset 0 0 0 1px rgba(255,255,255,.12), 0 8px 30px rgba(0,0,0,.6)' }
};

const LIGHTING_FILTERS = {
  natural: 'none',
  'golden-hour': 'sepia(.18) saturate(1.12) brightness(1.05)',
  'blue-hour': 'hue-rotate(-14deg) saturate(.92) brightness(.95)',
  candlelight: 'sepia(.28) saturate(1.18) brightness(1.04)',
  moonlight: 'saturate(.7) brightness(.94) hue-rotate(8deg)',
  firelight: 'sepia(.24) saturate(1.35) contrast(1.06)',
  magic: 'hue-rotate(28deg) saturate(1.22)',
  dark: 'brightness(.8) contrast(1.16)',
  'high-contrast': 'contrast(1.32) saturate(1.06)'
};

const ARTIFACT_ICONS = {
  scroll: 'i-scroll', dagger: 'i-dagger', sword: 'i-sword', staff: 'i-staff',
  orb: 'i-orb', potion: 'i-flask', quill: 'i-quill', lute: 'i-lute',
  bow: 'i-bow', hammer: 'i-hammer', shield: 'i-shield', torch: 'i-torch',
  book: 'i-book'
};

export function getArtifactIcon(id) {
  return ARTIFACT_ICONS[id] || null;
}

// Headgear is drawn as an SVG overlay on top of the portrait (coordinates in the
// DiceBear avataaars 280x280 viewBox). This keeps the chosen hairstyle visible.
const HEADGEAR_OVERLAYS = {
  circlet: '<g><path d="M99 66 Q140 54 181 66" stroke="#e4bf70" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M99 66 Q140 54 181 66" stroke="#f5d99e" stroke-width="1.2" fill="none" opacity=".8"/><path d="M140 54 l6 8 -6 8 -6 -8 Z" fill="#7ad7ff" stroke="#f5d99e" stroke-width="1.4"/></g>',
  'crown-simple': '<g><path d="M104 52 L108 26 L123 40 L140 20 L157 40 L172 26 L176 52 Z" fill="#e4bf70" stroke="#b8963e" stroke-width="2" stroke-linejoin="round"/><path d="M104 52 Q140 46 176 52" stroke="#b8963e" stroke-width="3" fill="none"/><circle cx="140" cy="32" r="3.2" fill="#b03050"/><circle cx="120" cy="44" r="2.4" fill="#5cdbe2"/><circle cx="160" cy="44" r="2.4" fill="#5cdbe2"/></g>',
  'crown-ornate': '<g><path d="M100 54 L102 24 L118 38 L126 14 L140 34 L154 14 L162 38 L178 24 L180 54 Z" fill="#e4bf70" stroke="#b8963e" stroke-width="2" stroke-linejoin="round"/><path d="M100 54 Q140 46 180 54" stroke="#b8963e" stroke-width="3.5" fill="none"/><circle cx="140" cy="42" r="4" fill="#b03050" stroke="#f5d99e" stroke-width="1.2"/><circle cx="118" cy="46" r="2.6" fill="#5cdbe2"/><circle cx="162" cy="46" r="2.6" fill="#5cdbe2"/><path d="M126 14 l4 8 -4 6 -4 -6 Z" fill="#f5d99e"/><path d="M154 14 l4 8 -4 6 -4 -6 Z" fill="#f5d99e"/></g>',
  'helmet-open': '<g><path d="M94 62 Q94 24 140 22 Q186 24 186 62 Q140 50 94 62 Z" fill="#9aa3ad" stroke="#5a626c" stroke-width="2" stroke-linejoin="round"/><path d="M94 62 Q140 50 186 62 L184 70 Q140 58 96 70 Z" fill="#e4bf70" opacity=".9"/><path d="M136 22 h8 v36 h-8 Z" fill="#e4bf70" opacity=".75"/><path d="M124 24 Q140 6 156 24" fill="none" stroke="#e4bf70" stroke-width="2.5" stroke-linecap="round"/></g>',
  'helmet-full': '<g><path d="M90 64 Q90 20 140 18 Q190 20 190 64 Q140 52 90 64 Z" fill="#8a9099" stroke="#4a4f57" stroke-width="2" stroke-linejoin="round"/><path d="M90 64 Q86 104 104 130 L118 127 Q104 96 108 66 Z" fill="#8a9099" stroke="#4a4f57" stroke-width="2" stroke-linejoin="round"/><path d="M190 64 Q194 104 176 130 L162 127 Q176 96 172 66 Z" fill="#8a9099" stroke="#4a4f57" stroke-width="2" stroke-linejoin="round"/><path d="M108 66 Q140 54 172 66" stroke="#e4bf70" stroke-width="3" fill="none" opacity=".9"/><path d="M136 20 h8 v34 h-8 Z" fill="#e4bf70" opacity=".7"/></g>',
  'hood-up': '<g><path d="M140 12 C84 12 60 66 70 144 L96 156 C84 102 100 54 140 54 C180 54 196 102 184 156 L210 144 C220 66 196 12 140 12 Z" fill="#33402e" stroke="#1c2519" stroke-width="2" stroke-linejoin="round"/><path d="M96 156 Q140 138 184 156" fill="none" stroke="#1c2519" stroke-width="2" opacity=".6"/></g>',
  'hood-down': '<g><path d="M84 214 Q92 166 104 154 Q120 146 140 152 Q160 146 176 154 Q188 166 196 214 Q140 188 84 214 Z" fill="#33402e" stroke="#1c2519" stroke-width="2" stroke-linejoin="round"/><path d="M104 166 Q140 156 176 166" fill="none" stroke="#1c2519" stroke-width="2" opacity=".55"/><path d="M96 184 Q140 174 184 184" fill="none" stroke="#26301f" stroke-width="2" opacity=".65"/><path d="M102 202 Q140 192 178 202" fill="none" stroke="#26301f" stroke-width="2" opacity=".5"/></g>',
  'hat-wide': '<g><ellipse cx="140" cy="58" rx="68" ry="13" fill="#2a2533" stroke="#141119" stroke-width="2"/><path d="M110 58 Q112 20 140 18 Q168 20 170 58 Z" fill="#3a3346" stroke="#141119" stroke-width="2" stroke-linejoin="round"/><path d="M111 52 Q140 44 169 52 L169 59 Q140 51 111 59 Z" fill="#e4bf70" opacity=".85"/></g>',
  tricorne: '<g><path d="M76 62 Q104 34 140 36 Q176 34 204 62 Q174 50 140 52 Q106 50 76 62 Z" fill="#20263a" stroke="#10131c" stroke-width="2" stroke-linejoin="round"/><path d="M108 50 Q112 22 140 22 Q168 22 172 50 Z" fill="#2b3348" stroke="#10131c" stroke-width="2"/><path d="M108 48 Q140 40 172 48" fill="none" stroke="#e4bf70" stroke-width="2.5"/><circle cx="140" cy="44" r="2.6" fill="#e4bf70"/></g>',
  bandana: '<g><path d="M96 64 Q96 26 140 24 Q184 26 184 64 Q140 50 96 64 Z" fill="#a03038" stroke="#6e1f24" stroke-width="2" stroke-linejoin="round"/><path d="M178 62 q16 -10 20 2 q-12 6 -20 6 Z" fill="#a03038" stroke="#6e1f24" stroke-width="1.5"/><path d="M104 42 Q140 30 176 42" fill="none" stroke="#7a2028" stroke-width="1.5" opacity=".7"/></g>',
  headband: '<g><path d="M96 72 Q140 54 184 72" stroke="#5a4632" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M96 68 Q140 50 184 68" stroke="#8a6f50" stroke-width="1.4" fill="none" opacity=".7"/></g>',
  feathers: '<g><path d="M98 70 Q140 54 182 70" stroke="#5a4632" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M156 58 Q168 18 200 2 Q190 40 170 60 Z" fill="#e4bf70" stroke="#b8963e" stroke-width="1.6" stroke-linejoin="round"/><path d="M140 58 Q128 16 98 2 Q112 40 130 60 Z" fill="#b03038" stroke="#7a1f28" stroke-width="1.6" stroke-linejoin="round"/><path d="M148 58 Q148 26 156 10 Q160 34 156 58 Z" fill="#5cdbe2" stroke="#2b8a92" stroke-width="1.2" stroke-linejoin="round"/></g>',
  'horns-small': '<g fill="#e6dccb" stroke="#a89a86" stroke-width="1.6" stroke-linejoin="round"><path d="M98 60 q-22 -8 -20 -34 q22 8 28 30 Z"/><path d="M182 60 q22 -8 20 -34 q-22 8 -28 30 Z"/></g>',
  'horns-large': '<g fill="#d8cdbf" stroke="#9a8c78" stroke-width="1.6" stroke-linejoin="round"><path d="M95 62 q-28 -8 -26 -46 q24 10 33 42 Z"/><path d="M185 62 q28 -8 26 -46 q-24 10 -33 42 Z"/></g>'
};

export function getBackdropGradient(id) {
  return BACKDROP_GRADIENTS[id] || BACKDROP_GRADIENTS.fortress;
}

function avatarTransform(appearance) {
  const height = { short: 0.94, average: 1, tall: 1.04, towering: 1.08 }[appearance.height] || 1;
  const build = { slender: 0.96, average: 1, athletic: 1.02, stocky: 1.05, muscular: 1.07, soft: 1.04 }[appearance.build] || 1;
  const face = {
    oval: [1, 1], round: [1.03, 0.98], square: [1.04, 1],
    heart: [0.98, 1.02], diamond: [1.02, 1.03], long: [0.97, 1.04], angular: [1.04, 1.01]
  }[appearance.face] || [1, 1];
  const rotate = { straight: 0, relaxed: 1.5, hunched: -3, ready: -1.5, swagger: 2 }[appearance.posture] || 0;
  return `scale(${(height * build * face[0]).toFixed(3)}, ${(height * face[1]).toFixed(3)}) rotate(${rotate}deg)`;
}

function mixHex(a, b, ratio = 0.5) {
  const parse = (h) => {
    h = stripHash(h);
    if (h.length !== 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return stripHash(a);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * ratio));
  return out.map(v => v.toString(16).padStart(2, '0')).join('');
}

function stripHash(hex) {
  return (hex || '').replace('#', '');
}

function hexToRgba(hex, alpha) {
  const h = stripHash(hex);
  if (h.length !== 6) return `rgba(201,168,76,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// amount < 0 assombrit, amount > 0 éclaircit (0..1)
function shadeHex(hex, amount) {
  const h = stripHash(hex);
  if (h.length !== 6) return hex || '#8a6320';
  const num = parseInt(h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  const target = amount < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amount));
  r = Math.round(r + (target - r) * p);
  g = Math.round(g + (target - g) * p);
  b = Math.round(b + (target - b) * p);
  return `rgb(${r},${g},${b})`;
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDiamond(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSpacedText(ctx, text, x, y, spacing = 2) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  const previousAlign = ctx.textAlign;
  let cursor = previousAlign === 'left' ? x : previousAlign === 'right' ? x - total : x - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cursor, y);
    cursor += widths[i] + spacing;
  });
  ctx.textAlign = previousAlign;
}

function fitText(ctx, text, maxWidth) {
  text = String(text || '');
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}
