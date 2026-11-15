/* ==========================================================================
   AETHERIA — Moteur d'Avatar SVG Modulaire
   Génère un avatar complet par composition de calques (layers)
   ========================================================================== */

class AvatarEngine {
  constructor() {
    this.cache = new Map();
    this.particleAnimations = new Map();
  }

  // ==========================================================================
  // ENTRY POINT : Génère le SVG complet
  // ==========================================================================
  generate(appearance, classKey, options = {}) {
    const cacheKey = JSON.stringify({ appearance, classKey, ...options });
    if (this.cache.has(cacheKey) && !options.noCache) {
      return this.cache.get(cacheKey);
    }

    const cls = GAME_DATA.CLASSES[classKey] || GAME_DATA.CLASSES.paladin;
    const race = GAME_DATA.RACES.find(r => r.id === appearance.race) || GAME_DATA.RACES[0];
    const skin = GAME_DATA.SKIN_TONES[appearance.skin] || GAME_DATA.SKIN_TONES.peach;
    const hairColor = GAME_DATA.HAIR_COLORS[appearance.hairColor] || GAME_DATA.HAIR_COLORS.brown;
    const hairHighlight = GAME_DATA.HAIR_HIGHLIGHTS.find(h => h.id === appearance.hairHighlight) || GAME_DATA.HAIR_HIGHLIGHTS[0];
    const eyeColor = GAME_DATA.EYE_COLORS[appearance.eyes] || GAME_DATA.EYE_COLORS.amber;
    const expression = GAME_DATA.EXPRESSIONS.find(e => e.id === appearance.expression) || GAME_DATA.EXPRESSIONS[0];
    const mark = GAME_DATA.MARKS.find(m => m.id === appearance.mark) || GAME_DATA.MARKS[0];
    const facialHair = GAME_DATA.FACIAL_HAIR.find(f => f.id === appearance.facialHair) || GAME_DATA.FACIAL_HAIR[0];
    const warpaint = GAME_DATA.WARPAINTS.find(w => w.id === appearance.warpaint) || GAME_DATA.WARPAINTS[0];
    const hairStyle = GAME_DATA.HAIRSTYLES.find(h => h.id === appearance.hairStyle) || GAME_DATA.HAIRSTYLES[0];
    const outfit = this.getOutfitSVG(classKey, appearance.outfit);
    const headgear = GAME_DATA.HEADGEAR.find(h => h.id === appearance.headgear) || GAME_DATA.HEADGEAR[0];
    const artifact = GAME_DATA.ARTIFACTS.find(a => a.id === appearance.artifact) || GAME_DATA.ARTIFACTS[0];
    const aura = GAME_DATA.AURAS.find(a => a.id === appearance.aura) || GAME_DATA.AURAS[0];
    const frame = GAME_DATA.FRAMES.find(f => f.id === appearance.frame) || GAME_DATA.FRAMES[0];

    // Morphologie
    const build = GAME_DATA.BUILDS.find(b => b.id === appearance.build) || GAME_DATA.BUILDS[1];
    const height = GAME_DATA.HEIGHTS.find(h => h.id === appearance.height) || GAME_DATA.HEIGHTS[1];
    const posture = GAME_DATA.POSTURES.find(p => p.id === appearance.posture) || GAME_DATA.POSTURES[0];
    const faceShape = GAME_DATA.FACE_SHAPES.find(f => f.id === appearance.face) || GAME_DATA.FACE_SHAPES[0];

    // Échelle et positionnement caméra
    const scale = height.scale * (build.bodyScale?.width || 1);
    const cameraY = height.cameraY;
    const postureOffset = {
      tx: 0,
      ty: (posture.spine || 0) * 0.5,
      rotate: (posture.shoulders || 0) * 0.5
    };

    // Construction du SVG par calques (ordre = z-index)
    const layers = [];

    // 0. Aura (arrière-plan, derrière tout)
    if (aura.id !== 'none') {
      layers.push({ id: 'aura', z: 0, svg: this.renderAura(aura, cls) });
    }

    // 1. Corps / Torse / Armure
    layers.push({ id: 'body', z: 10, svg: this.renderBody(cls, race, build, skin, outfit, appearance, postureOffset) });

    // 2. Cou
    layers.push({ id: 'neck', z: 15, svg: this.renderNeck(skin, build, postureOffset) });

    // 3. Tête (base + visage)
    layers.push({ id: 'head', z: 20, svg: this.renderHead(race, skin, build, height, faceShape, postureOffset) });

    // 4. Oreilles
    layers.push({ id: 'ears', z: 22, svg: this.renderEars(race, skin, build, height, postureOffset) });

    // 5. Marques faciales (sous les yeux)
    if (mark.id !== 'none') {
      layers.push({ id: 'mark', z: 24, svg: this.renderMark(mark, skin, build, height, postureOffset) });
    }

    // 6. Warpaint
    if (warpaint.id !== 'none') {
      layers.push({ id: 'warpaint', z: 25, svg: this.renderWarpaint(warpaint, skin, build, height, postureOffset) });
    }

    // 7. Pilosité faciale (sous la bouche)
    if (facialHair.id !== 'none') {
      layers.push({ id: 'facialHair', z: 26, svg: this.renderFacialHair(facialHair, hairColor, build, height, postureOffset) });
    }

    // 8. Yeux
    layers.push({ id: 'eyes', z: 28, svg: this.renderEyes(eyeColor, expression, race, build, height, faceShape, postureOffset, skin) });

    // 9. Sourcils (partie de l'expression)
    layers.push({ id: 'brows', z: 29, svg: this.renderBrows(expression, hairColor, build, height, faceShape, postureOffset) });

    // 10. Bouche (partie de l'expression)
    layers.push({ id: 'mouth', z: 30, svg: this.renderMouth(expression, skin, build, height, faceShape, postureOffset) });

    // 11. Cheveux (dessus de la tête)
    layers.push({ id: 'hair', z: 35, svg: this.renderHair(hairStyle, hairColor, hairHighlight, race, build, height, postureOffset) });

    // 12. Couvre-chef
    if (headgear.id !== 'none') {
      layers.push({ id: 'headgear', z: 38, svg: this.renderHeadgear(headgear, race, build, height, postureOffset) });
    }

    // 13. Artefact en main
    if (artifact.id !== 'none') {
      layers.push({ id: 'artifact', z: 40, svg: this.renderArtifact(artifact, cls, build, height, postureOffset) });
    }

    // Trier par z-index
    layers.sort((a, b) => a.z - b.z);

    // Assembler
    const svgParts = layers.map(l => l.svg).join('\n');

    const viewBox = options.thumb ? '0 0 64 64' : '0 0 400 480';
    const width = options.thumb ? 64 : 400;
    const height_ = options.thumb ? 64 : 480;

    let transform = '';
    if (!options.thumb) {
      transform = `translate(200, 240) scale(${scale}) translate(-200, -240) translate(0, ${(cameraY - 1) * 40 + (postureOffset.ty * 40)})`;
      if (postureOffset.rotate) {
        transform += ` rotate(${postureOffset.rotate * 10}, 200, 240)`;
      }
    }

    const svg = `<svg viewBox="${viewBox}" class="avatar-svg" preserveAspectRatio="xMidYMin slice" role="img" aria-label="Avatar de ${appearance.name || 'Aventurier'}" xmlns="http://www.w3.org/2000/svg">
${svgParts}
</svg>`;

    if (!options.noCache) this.cache.set(cacheKey, svg);
    return svg;
  }

  // ==========================================================================
  // MINIATURE (pour la grille de guilde)
  // ==========================================================================
  generateThumb(appearance, classKey) {
    return this.generate(appearance, classKey, { thumb: true });
  }

  // ==========================================================================
  // CALQUE : AURA
  // ==========================================================================
  renderAura(aura, cls) {
    if (aura.id === 'none') return '';
    const color = aura.color || cls.color;
    return `<g class="avatar-layer aura" filter="url(#aura-glow)">
${aura.svg || ''}
</g>`;
  }

  // ==========================================================================
  // CALQUE : CORPS / ARMURE
  // ==========================================================================
  renderBody(cls, race, build, skin, outfit, appearance, postureOffset) {
    const bw = build.bodyScale?.width || 1;
    const bt = build.bodyScale?.torso || 1;
    const color = cls.color;

    // SVG de base selon la classe
    const classOutfits = {
      paladin: this.getPaladinArmor(color, bw, bt),
      ranger: this.getRangerArmor(color, bw, bt),
      bard: this.getBardArmor(color, bw, bt),
      alchemist: this.getAlchemistArmor(color, bw, bt)
    };

    return `<g class="avatar-layer body" transform="translate(0, ${postureOffset.ty * 40})">
${classOutfits[cls.id] || classOutfits.paladin}
</g>`;
  }

  getPaladinArmor(color, bw, bt) {
    const gold = '#f5d99e';
    const steel = '#c8c8d0';
    const darkSteel = '#383848';
    const w = 100 * bw;
    const h = 140 * bt;
    return `
<!-- Épaulettes -->
<ellipse cx="${200 - w*0.4}" cy="160" rx="${30*bw}" ry="${20*bt}" fill="${color}" stroke="${gold}" stroke-width="2" filter="drop-shadow(0 0 4px ${color})"/>
<ellipse cx="${200 + w*0.4}" cy="160" rx="${30*bw}" ry="${20*bt}" fill="${color}" stroke="${gold}" stroke-width="2" filter="drop-shadow(0 0 4px ${color})"/>

<!-- Plastron -->
<path d="M${200-w*0.5} 150 L${200-w*0.3} 130 L${200+w*0.3} 130 L${200+w*0.5} 150 L${200+w*0.6} 280 L${200-w*0.6} 280 Z" fill="${steel}" stroke="${darkSteel}" stroke-width="2"/>
<path d="M${200-w*0.35} 135 L${200+w*0.35} 135 L${200+w*0.45} 260 L${200-w*0.45} 260 Z" fill="${color}" stroke="${gold}" stroke-width="2.5" opacity=".9"/>

<!-- Ceinture -->
<rect x="${200-w*0.5}" y="260" width="${w}" height="12" fill="#281810" stroke="#483020" stroke-width="1.5"/>
<rect x="${200-8}" y="258" width="16" height="16" fill="${gold}" stroke="${color}" stroke-width="2" rx="3"/>

<!-- Brassards -->
<rect x="${200-w*0.65}" y="160" width="${w*0.25}" height="80" fill="${darkSteel}" stroke="${gold}" stroke-width="1.5" rx="4"/>
<rect x="${200+w*0.4}" y="160" width="${w*0.25}" height="80" fill="${darkSteel}" stroke="${gold}" stroke-width="1.5" rx="4"/>

<!-- Gantelets -->
<ellipse cx="${200-w*0.65}" cy="250" rx="${18*bw}" ry="${12*bt}" fill="${steel}" stroke="${darkSteel}" stroke-width="2"/>
<ellipse cx="${200+w*0.65}" cy="250" rx="${18*bw}" ry="${12*bt}" fill="${steel}" stroke="${darkSteel}" stroke-width="2"/>

<!-- Cape (derrière) -->
<path d="M${200-w*0.4} 140 Q${200-w*0.8} 180 ${200-w*0.5} 280 Q${200} 260 ${200+w*0.5} 280 Q${200+w*0.8} 180 ${200+w*0.4} 140" fill="#181820" stroke="${color}" stroke-width="1" opacity=".6" transform="translate(0, -20)"/>
`;
  }

  getRangerArmor(color, bw, bt) {
    const leather = '#382818';
    const darkLeather = '#181008';
    const w = 100 * bw;
    return `
<!-- Cape forestière -->
<path d="M${200-w*0.4} 130 Q${200-w*0.9} 180 ${200-w*0.5} 300 Q${200} 270 ${200+w*0.5} 300 Q${200+w*0.9} 180 ${200+w*0.4} 130" fill="#0d2510" stroke="#285020" stroke-width="1" opacity=".7"/>

<!-- Tunique en cuir -->
<path d="M${200-w*0.45} 130 L${200-w*0.3} 115 L${200+w*0.3} 115 L${200+w*0.45} 130 L${200+w*0.55} 290 L${200-w*0.55} 290 Z" fill="${leather}" stroke="${darkLeather}" stroke-width="2"/>

<!-- Panneaux renforcés -->
<path d="M${200-w*0.35} 120 L${200+w*0.35} 120 L${200+w*0.4} 270 L${200-w*0.4} 270 Z" fill="#283820" stroke="#182810" stroke-width="1.5"/>

<!-- Ceinture avec pochettes -->
<rect x="${200-w*0.45}" y="265" width="${w*0.9}" height="10" fill="#281810" stroke="#483010" stroke-width="1"/>
<rect x="${200-w*0.2}" y="260" width="30" height="20" fill="#382818" stroke="#584020" stroke-width="1" rx="2"/>
<rect x="${200+w*0.1}" y="260" width="25" height="20" fill="#382818" stroke="#584020" stroke-width="1" rx="2"/>

<!-- Bandoulière -->
<path d="M${200-w*0.4} 120 Q${200} 180 ${200+w*0.4} 270" stroke="#382010" stroke-width="6" fill="none" stroke-linecap="round"/>
<circle cx="${200}" cy="190" r="5" fill="#e4bf70"/>

<!-- Brassards cuir -->
<rect x="${200-w*0.55}" y="150" width="${w*0.2}" height="60" fill="#281810" stroke="#483010" stroke-width="1" rx="3"/>
<rect x="${200+w*0.35}" y="150" width="${w*0.2}" height="60" fill="#281810" stroke="#483010" stroke-width="1" rx="3"/>

<!-- Bottes -->
<path d="M${200-w*0.4} 290 L${200-w*0.35} 340 L${200+w*0.35} 340 L${200+w*0.4} 290 Z" fill="#181008" stroke="#080808" stroke-width="1.5"/>
`;
  }

  getBardArmor(color, bw, bt) {
    const velvet = color;
    const gold = '#f5d99e';
    const w = 100 * bw;
    return `
<!-- Doublet de velours -->
<path d="M${200-w*0.45} 125 L${200-w*0.3} 110 L${200+w*0.3} 110 L${200+w*0.45} 125 L${200+w*0.5} 290 L${200-w*0.5} 290 Z" fill="${velvet}" stroke="${gold}" stroke-width="1.5"/>

<!-- Jabot / Col -->
<path d="M${200-w*0.2} 115 Q${200} 130 ${200+w*0.2} 115 Q${200} 140 ${200-w*0.2} 115" fill="#fdf8f0" stroke="${gold}" stroke-width="1" opacity=".9"/>

<!-- Ceinture ornée -->
<rect x="${200-w*0.4}" y="260" width="${w*0.8}" height="12" fill="${velvet}" stroke="${gold}" stroke-width="2"/>
<ellipse cx="200" cy="266" rx="15" ry="6" fill="${gold}" stroke="${color}" stroke-width="1.5"/>

<!-- Épaulettes bouffantes -->
<ellipse cx="${200-w*0.4}" cy="145" rx="${25*bw}" ry="${18*bt}" fill="${velvet}" stroke="${gold}" stroke-width="1.5"/>
<ellipse cx="${200+w*0.4}" cy="145" rx="${25*bw}" ry="${18*bt}" fill="${velvet}" stroke="${gold}" stroke-width="1.5"/>

<!-- Manches évasées -->
<path d="M${200-w*0.4} 145 Q${200-w*0.7} 180 ${200-w*0.55} 250 L${200-w*0.35} 250 Q${200-w*0.2} 180 ${200-w*0.4} 145" fill="${velvet}" stroke="${gold}" stroke-width="1"/>
<path d="M${200+w*0.4} 145 Q${200+w*0.7} 180 ${200+w*0.55} 250 L${200+w*0.35} 250 Q${200+w*0.2} 180 ${200+w*0.4} 145" fill="${velvet}" stroke="${gold}" stroke-width="1"/>

<!-- Gants fins -->
<ellipse cx="${200-w*0.55}" cy="250" rx="${14*bw}" ry="${10*bt}" fill="#fdf8f0" stroke="${velvet}" stroke-width="1"/>
<ellipse cx="${200+w*0.55}" cy="250" rx="${14*bw}" ry="${10*bt}" fill="#fdf8f0" stroke="${velvet}" stroke-width="1"/>
`;
  }

  getAlchemistArmor(color, bw, bt) {
    const coat = '#182028';
    const leather = '#382818';
    const gold = '#e4bf70';
    const w = 100 * bw;
    return `
<!-- Long manteau -->
<path d="M${200-w*0.45} 125 L${200-w*0.3} 110 L${200+w*0.3} 110 L${200+w*0.45} 125 L${200+w*0.55} 310 L${200-w*0.55} 310 Z" fill="${coat}" stroke="#283040" stroke-width="1.5"/>

<!-- Tablier cuir par-dessus -->
<path d="M${200-w*0.35} 130 L${200+w*0.35} 130 L${200+w*0.4} 300 L${200-w*0.4} 300 Z" fill="${leather}" stroke="#181008" stroke-width="2"/>

<!-- Ceinture porte-fioles -->
<rect x="${200-w*0.35}" y="250" width="${w*0.7}" height="14" fill="#181008" stroke="#382010" stroke-width="1.5" rx="3"/>
<g fill="none" stroke="${gold}" stroke-width="1.5">
  <rect x="${200-w*0.2}" y="240" width="8" height="18" rx="2"/>
  <rect x="${200-w*0.05}" y="235" width="8" height="22" rx="2"/>
  <rect x="${200+w*0.1}" y="240" width="8" height="18" rx="2"/>
</g>

<!-- Poches latérales -->
<rect x="${200-w*0.45}" y="180" width="28" height="35" fill="${leather}" stroke="#181008" stroke-width="1.5" rx="3"/>
<rect x="${200+w*0.17}" y="180" width="28" height="35" fill="${leather}" stroke="#181008" stroke-width="1.5" rx="3"/>

<!-- Brassards -->
<rect x="${200-w*0.55}" y="145" width="${w*0.2}" height="70" fill="#283040" stroke="#384050" stroke-width="1" rx="3"/>
<rect x="${200+w*0.35}" y="145" width="${w*0.2}" height="70" fill="#283040" stroke="#384050" stroke-width="1" rx="3"/>

<!-- Gants de travail -->
<ellipse cx="${200-w*0.55}" cy="260" rx="${16*bw}" ry="${12*bt}" fill="#281810" stroke="#382010" stroke-width="1.5"/>
<ellipse cx="${200+w*0.55}" cy="260" rx="${16*bw}" ry="${12*bt}" fill="#281810" stroke="#382010" stroke-width="1.5"/>
`;
  }

  // ==========================================================================
  // CALQUE : COU
  // ==========================================================================
  renderNeck(skin, build, postureOffset) {
    const bw = build.bodyScale?.width || 1;
    return `<g class="avatar-layer neck">
<rect x="${200 - 18*bw}" y="100" width="${36*bw}" height="25" fill="${skin.shadow}" rx="4" transform="translate(0, ${postureOffset.ty * 40})"/>
</g>`;
  }

  // ==========================================================================
  // CALQUE : TÊTE (BASE)
  // ==========================================================================
  renderHead(race, skin, build, height, faceShape, postureOffset) {
    const bw = build.bodyScale?.width || 1;
    const hs = height.scale;
    const jaw = faceShape.jaw || 0;
    const cheek = faceShape.cheek || 0;
    const chin = faceShape.chin || 0;

    // Ajustements morphologiques
    const headWidth = 130 * bw * (1 + cheek/100);
    const jawWidth = headWidth * (1 + jaw/100);
    const chinLength = 40 * (1 + chin/100);

    const x = 200 - headWidth/2;
    const jawX = 200 - jawWidth/2;
    const rightX = 200 + jawWidth/2;

    return `<g class="avatar-layer head" transform="translate(0, ${postureOffset.ty * 40})">
<!-- Base du visage -->
<path d="M${x} 80 
         Q${200} ${40 - cheek*0.5} ${200 + headWidth/2} 80
         Q${rightX} 140 ${200 + jawWidth/2} 180
         Q${200} ${180 + chinLength} ${200 - jawWidth/2} 180
         Q${jawX} 140 ${x} 80 Z" 
      fill="${skin.base}" stroke="${skin.shadow}" stroke-width="1.5"/>

<!-- Ombre sous menton -->
<path d="M${200 - 30} 185 Q${200} 195 ${200 + 30} 185" fill="${skin.shadow}" opacity=".3"/>

${race.ears === 'pointed' ? this.renderElfEars(skin, bw, postureOffset) : ''}
</g>`;
  }

  renderElfEars(skin, bw, postureOffset) {
    return `<g class="avatar-layer ears">
<path d="M${200 - 65*bw} 60 Q${200 - 95*bw} 40 ${200 - 60*bw} 30 Q${200 - 50*bw} 40 ${200 - 65*bw} 60" fill="${skin.base}" stroke="${skin.shadow}" stroke-width="1.5" transform="translate(0, ${postureOffset.ty * 40})"/>
<path d="M${200 + 65*bw} 60 Q${200 + 95*bw} 40 ${200 + 60*bw} 30 Q${200 + 50*bw} 40 ${200 + 65*bw} 60" fill="${skin.base}" stroke="${skin.shadow}" stroke-width="1.5" transform="translate(0, ${postureOffset.ty * 40})"/>
</g>`;
  }

  // ==========================================================================
  // CALQUE : OREILLES (Humain)
  // ==========================================================================
  renderEars(race, skin, build, height, postureOffset) {
    if (race.ears === 'pointed') return ''; // Déjà dans renderHead
    const bw = build.bodyScale?.width || 1;
    return `<g class="avatar-layer ears" transform="translate(0, ${postureOffset.ty * 40})">
<ellipse cx="${200 - 65*bw}" cy="80" rx="${8*bw}" ry="${16}" fill="${skin.shadow}"/>
<ellipse cx="${200 + 65*bw}" cy="80" rx="${8*bw}" ry="${16}" fill="${skin.shadow}"/>
<!-- Détail interne -->
<ellipse cx="${200 - 63*bw}" cy="78" rx="${4*bw}" ry="${10}" fill="${skin.base}"/>
<ellipse cx="${200 + 63*bw}" cy="78" rx="${4*bw}" ry="${10}" fill="${skin.base}"/>
</g>`;
  }

  // ==========================================================================
  // CALQUE : MARQUES
  // ==========================================================================
  renderMark(mark, skin, build, height, postureOffset) {
    if (!mark.svg) return '';
    return `<g class="avatar-layer mark" transform="translate(0, ${postureOffset.ty * 40})">
${mark.svg}
</g>`;
  }

  // ==========================================================================
  // CALQUE : WARPAINT
  // ==========================================================================
  renderWarpaint(warpaint, skin, build, height, postureOffset) {
    if (!warpaint.svg) return '';
    return `<g class="avatar-layer warpaint" transform="translate(0, ${postureOffset.ty * 40})">
${warpaint.svg}
</g>`;
  }

  // ==========================================================================
  // CALQUE : PILOSITÉ FACIALE
  // ==========================================================================
  renderFacialHair(facialHair, hairColor, build, height, postureOffset) {
    if (!facialHair.svg) return '';
    const color = hairColor.base;
    return `<g class="avatar-layer facial-hair" transform="translate(0, ${postureOffset.ty * 40})">
${facialHair.svg.replace(/currentColor|fill="#[^"]*"/g, `fill="${color}"`)}
</g>`;
  }

  // ==========================================================================
  // CALQUE : YEUX
  // ==========================================================================
  renderEyes(eyeColor, expression, race, build, height, faceShape, postureOffset, skin) {
    const bw = build.bodyScale?.width || 1;
    const hs = height.scale;
    const eyeSpacing = 40 * bw;
    const eyeY = 70;
    const eyeSize = 10;
    const isHetero = eyeColor.id === 'heterochromia';

    const irisColor = eyeColor.iris;
    const irisColor2 = eyeColor.iris2 || eyeColor.iris;
    const sclera = eyeColor.sclera;
    const glow = eyeColor.glow;

    // Forme selon expression
    let eyeShape = 'ellipse';
    let eyeHeight = eyeSize;
    if (expression.id === 'narrow' || expression.id === 'stern' || expression.id === 'fierce' || expression.id === 'cunning') {
      eyeHeight = eyeSize * 0.6;
    } else if (expression.id === 'wide' || expression.id === 'curious') {
      eyeHeight = eyeSize * 1.3;
    } else if (expression.id === 'half' || expression.id === 'smirk' || expression.id === 'dreamy' || expression.id === 'weary') {
      eyeHeight = eyeSize * 0.7;
    }

    const leftIris = isHetero ? irisColor2 : irisColor;
    const rightIris = isHetero ? irisColor : irisColor2;

    return `<g class="avatar-layer eyes" transform="translate(0, ${postureOffset.ty * 40})">
<!-- Blancs des yeux -->
<ellipse cx="${200 - eyeSpacing}" cy="${eyeY}" rx="${eyeSize}" ry="${eyeHeight}" fill="${sclera}" stroke="${skin.shadow}" stroke-width=".5"/>
<ellipse cx="${200 + eyeSpacing}" cy="${eyeY}" rx="${eyeSize}" ry="${eyeHeight}" fill="${sclera}" stroke="${skin.shadow}" stroke-width=".5"/>

<!-- Iris -->
<ellipse cx="${200 - eyeSpacing}" cy="${eyeY}" rx="${eyeSize * 0.5}" ry="${eyeHeight * 0.6}" fill="${leftIris}" filter="drop-shadow(0 0 3px ${glow})"/>
<ellipse cx="${200 + eyeSpacing}" cy="${eyeY}" rx="${eyeSize * 0.5}" ry="${eyeHeight * 0.6}" fill="${rightIris}" filter="drop-shadow(0 0 3px ${glow})"/>

<!-- Pupilles -->
<ellipse cx="${200 - eyeSpacing}" cy="${eyeY - 1}" rx="${eyeSize * 0.2}" ry="${eyeHeight * 0.3}" fill="#080808"/>
<ellipse cx="${200 + eyeSpacing}" cy="${eyeY - 1}" rx="${eyeSize * 0.2}" ry="${eyeHeight * 0.3}" fill="#080808"/>

<!-- Reflets -->
<circle cx="${200 - eyeSpacing + 2}" cy="${eyeY - 3}" r="1.5" fill="#fff" opacity=".9"/>
<circle cx="${200 + eyeSpacing + 2}" cy="${eyeY - 3}" r="1.5" fill="#fff" opacity=".9"/>
<circle cx="${200 - eyeSpacing - 1}" cy="${eyeY + 2}" r="0.8" fill="#fff" opacity=".5"/>
<circle cx="${200 + eyeSpacing - 1}" cy="${eyeY + 2}" r="0.8" fill="#fff" opacity=".5"/>

${expression.id === 'glasses' ? this.renderGlasses(eyeSpacing, eyeY, eyeSize, eyeHeight, bw, postureOffset) : ''}
</g>`;
  }

  renderGlasses(eyeSpacing, eyeY, eyeSize, eyeHeight, bw, postureOffset) {
    return `<g class="avatar-glasses" transform="translate(0, ${postureOffset.ty * 40})">
<ellipse cx="${200 - eyeSpacing}" cy="${eyeY}" rx="${eyeSize * 1.2}" ry="${eyeHeight * 1.2}" fill="rgba(255,255,255,.15)" stroke="#e4bf70" stroke-width="2"/>
<ellipse cx="${200 + eyeSpacing}" cy="${eyeY}" rx="${eyeSize * 1.2}" ry="${eyeHeight * 1.2}" fill="rgba(255,255,255,.15)" stroke="#e4bf70" stroke-width="2"/>
<line x1="${200 - eyeSpacing/2}" y1="${eyeY}" x2="${200 + eyeSpacing/2}" y2="${eyeY}" stroke="#e4bf70" stroke-width="2"/>
<line x1="${200 - eyeSpacing*1.3}" y1="${eyeY}" x2="${200 - eyeSpacing*1.1}" y2="${eyeY}" stroke="#e4bf70" stroke-width="2"/>
<line x1="${200 + eyeSpacing*1.1}" y1="${eyeY}" x2="${200 + eyeSpacing*1.3}" y2="${eyeY}" stroke="#e4bf70" stroke-width="2"/>
</g>`;
  }

  // ==========================================================================
  // CALQUE : SOURCILS
  // ==========================================================================
  renderBrows(expression, hairColor, build, height, faceShape, postureOffset) {
    const bw = build.bodyScale?.width || 1;
    const color = hairColor.base;
    const eyeSpacing = 40 * bw;
    const browY = 50;

    let leftPath, rightPath;
    switch (expression.brows) {
      case 'furrowed':
        leftPath = `M${200 - eyeSpacing - 15} ${browY + 5} L${200 - eyeSpacing + 10} ${browY - 5}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY + 5} L${200 + eyeSpacing - 10} ${browY - 5}`;
        break;
      case 'raised':
        leftPath = `M${200 - eyeSpacing - 15} ${browY - 5} Q${200 - eyeSpacing} ${browY - 12} ${200 - eyeSpacing + 10} ${browY - 5}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY - 5} Q${200 + eyeSpacing} ${browY - 12} ${200 + eyeSpacing - 10} ${browY - 5}`;
        break;
      case 'arched':
        leftPath = `M${200 - eyeSpacing - 15} ${browY} Q${200 - eyeSpacing} ${browY - 10} ${200 - eyeSpacing + 10} ${browY}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY} Q${200 + eyeSpacing} ${browY - 10} ${200 + eyeSpacing - 10} ${browY}`;
        break;
      case 'low':
        leftPath = `M${200 - eyeSpacing - 15} ${browY + 8} L${200 - eyeSpacing + 10} ${browY + 8}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY + 8} L${200 + eyeSpacing - 10} ${browY + 8}`;
        break;
      case 'tired':
        leftPath = `M${200 - eyeSpacing - 15} ${browY + 3} Q${200 - eyeSpacing} ${browY + 8} ${200 - eyeSpacing + 10} ${browY + 3}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY + 3} Q${200 + eyeSpacing} ${browY + 8} ${200 + eyeSpacing - 10} ${browY + 3}`;
        break;
      case 'asym':
        leftPath = `M${200 - eyeSpacing - 15} ${browY + 5} L${200 - eyeSpacing + 10} ${browY - 2}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY - 2} Q${200 + eyeSpacing} ${browY - 10} ${200 + eyeSpacing - 10} ${browY}`;
        break;
      case 'relaxed':
        leftPath = `M${200 - eyeSpacing - 15} ${browY} L${200 - eyeSpacing + 10} ${browY}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY} L${200 + eyeSpacing - 10} ${browY}`;
        break;
      case 'glare':
        leftPath = `M${200 - eyeSpacing - 15} ${browY + 8} L${200 - eyeSpacing + 10} ${browY - 2}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY + 8} L${200 + eyeSpacing - 10} ${browY - 2}`;
        break;
      default: // flat
        leftPath = `M${200 - eyeSpacing - 15} ${browY} L${200 - eyeSpacing + 10} ${browY}`;
        rightPath = `M${200 + eyeSpacing + 15} ${browY} L${200 + eyeSpacing - 10} ${browY}`;
    }

    return `<g class="avatar-layer brows" transform="translate(0, ${postureOffset.ty * 40})">
<path d="${leftPath}" stroke="${color}" stroke-width="${3*bw}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${rightPath}" stroke="${color}" stroke-width="${3*bw}" stroke-linecap="round" stroke-linejoin="round"/>
</g>`;
  }

  // ==========================================================================
  // CALQUE : BOUCHE
  // ==========================================================================
  renderMouth(expression, skin, build, height, faceShape, postureOffset) {
    const bw = build.bodyScale?.width || 1;
    const mouthY = 115;
    const lipColor = skin.lip;
    const width = 25 * bw;

    let path;
    switch (expression.mouth) {
      case 'smile':
        path = `M${200 - width} ${mouthY} Q${200} ${mouthY - 10} ${200 + width} ${mouthY}`;
        break;
      case 'smirk':
        path = `M${200 - width} ${mouthY} Q${200} ${mouthY - 2} ${200 + width} ${mouthY - 6}`;
        break;
      case 'firm':
        path = `M${200 - width} ${mouthY} L${200 + width} ${mouthY}`;
        break;
      case 'thin':
        path = `M${200 - width*0.7} ${mouthY} L${200 + width*0.7} ${mouthY}`;
        break;
      case 'parted':
        path = `M${200 - width*0.5} ${mouthY} Q${200} ${mouthY + 8} ${200 + width*0.5} ${mouthY}`;
        break;
      case 'downturned':
        path = `M${200 - width} ${mouthY - 3} Q${200} ${mouthY + 5} ${200 + width} ${mouthY - 3}`;
        break;
      case 'grimace':
        path = `M${200 - width} ${mouthY} Q${200} ${mouthY + 12} ${200 + width} ${mouthY} Q${200} ${mouthY - 6} ${200 - width} ${mouthY}`;
        break;
      case 'slight':
        path = `M${200 - width*0.5} ${mouthY} Q${200} ${mouthY - 3} ${200 + width*0.5} ${mouthY}`;
        break;
      default: // line
        path = `M${200 - width*0.8} ${mouthY} L${200 + width*0.8} ${mouthY}`;
    }

    return `<g class="avatar-layer mouth" transform="translate(0, ${postureOffset.ty * 40})">
<path d="${path}" stroke="${lipColor}" stroke-width="${2.5*bw}" fill="none" stroke-linecap="round"/>
</g>`;
  }

  // ==========================================================================
  // CALQUE : CHEVEUX
  // ==========================================================================
  renderHair(hairStyle, hairColor, hairHighlight, race, build, height, postureOffset) {
    if (hairStyle.id === 'bald') return '';
    const bw = build.bodyScale?.width || 1;
    const hs = height.scale;
    const baseColor = hairColor.base;
    const lightColor = hairColor.light || hairColor.highlight || hairColor.base;
    const highlightColor = hairHighlight.color !== 'transparent' ? hairHighlight.color : lightColor;
    const isGradient = hairColor.gradient;

    // Remplacer currentColor dans le SVG de la coiffure
    let hairSvg = hairStyle.svg
      .replace(/currentColor/g, baseColor)
      .replace(/fill="#[^"]*"/g, `fill="${baseColor}"`)
      .replace(/stroke="#[^"]*"/g, `stroke="${baseColor}"`);

    // Ajouter les reflets si spécifiés
    if (hairHighlight.id !== 'none' && hairStyle.id !== 'bald') {
      const highlightSvg = hairStyle.svg
        .replace(/currentColor/g, highlightColor)
        .replace(/fill="#[^"]*"/g, `fill="${highlightColor}" opacity=".4"`)
        .replace(/<g /g, '<g filter="url(#hair-highlight)" ');
      hairSvg += highlightSvg;
    }

    // Gradient pour ombre/ombre
    if (isGradient) {
      hairSvg = hairSvg.replace(/fill="[^"]*"/, `fill="url(#hair-gradient-${hairStyle.id})"`);
    }

    return `<g class="avatar-layer hair" transform="translate(0, ${postureOffset.ty * 40})">
${hairSvg}
</g>`;
  }

  // ==========================================================================
  // CALQUE : COUVRE-CHEF
  // ==========================================================================
  renderHeadgear(headgear, race, build, height, postureOffset) {
    if (!headgear.svg) return '';
    return `<g class="avatar-layer headgear" transform="translate(0, ${postureOffset.ty * 40})">
${headgear.svg}
</g>`;
  }

  // ==========================================================================
  // CALQUE : ARTEFACT EN MAIN
  // ==========================================================================
  renderArtifact(artifact, cls, build, height, postureOffset) {
    if (!artifact.svg) return '';
    const color = cls.color;
    let svg = artifact.svg
      .replace(/#e4bf70|#f59e0b|#f5d99e/g, color)
      .replace(/#b45309|#ca8a04/g, color)
      .replace(/#38bdf8|#06b6d4/g, color)
      .replace(/#4ade80|#22c55e/g, color)
      .replace(/#a855f7|#b389ff/g, color)
      .replace(/#e86020|#ef4444/g, color);

    return `<g class="avatar-layer artifact" transform="translate(0, ${postureOffset.ty * 40})">
${svg}
</g>`;
  }

  // ==========================================================================
  // HELPER : OUTFIT SVG
  // ==========================================================================
  getOutfitSVG(classKey, outfitId) {
    // Utilisé pour le rendu complet, mais les tenues sont intégrées dans renderBody
    return '';
  }

  // ==========================================================================
  // GÉNÉRATION DU BACKDROP (Arrière-plan décoratif)
  // ==========================================================================
  generateBackdrop(backdropId, lightingId, particlesId) {
    const backdrop = GAME_DATA.BACKDROPS.find(b => b.id === backdropId) || GAME_DATA.BACKDROPS[0];
    const lighting = GAME_DATA.LIGHTINGS.find(l => l.id === lightingId) || GAME_DATA.LIGHTINGS[0];
    const particles = GAME_DATA.PARTICLES.find(p => p.id === particlesId) || GAME_DATA.PARTICLES[0];

    const filter = lighting.filter ? `filter="${lighting.filter}"` : '';

    return `<svg viewBox="0 0 400 480" class="portrait-backdrop-svg" ${filter} xmlns="http://www.w3.org/2000/svg">
${backdrop.svg || ''}
${particles.svg || ''}
</svg>`;
  }

  // ==========================================================================
  // GÉNÉRATION DU CADRE (Frame)
  // ==========================================================================
  generateFrame(frameId) {
    const frame = GAME_DATA.FRAMES.find(f => f.id === frameId) || GAME_DATA.FRAMES[0];
    return `<svg viewBox="0 0 400 480" class="portrait-frame-svg" xmlns="http://www.w3.org/2000/svg">
${frame.svg || ''}
</svg>`;
  }

  // ==========================================================================
  // NETTOYAGE CACHE
  // ==========================================================================
  clearCache() {
    this.cache.clear();
  }
}

// Instance globale
window.avatarEngine = new AvatarEngine();