/* ==========================================================================
   AETHERIA — Données du jeu : Races, Classes, Stats, Options d'apparence
   ========================================================================== */

// ==========================================================================
// PEUPLES / RACES (Morphologie de base)
// ==========================================================================
const RACES = [
  { id: 'human', name: 'Humain', desc: 'Équilibré, adaptable', baseBody: 'human', skinTones: ['pale', 'peach', 'olive', 'bronze', 'brown', 'dark'] },
  { id: 'elf', name: 'Elfe', desc: 'Grâce, longévité, magie', baseBody: 'elf', ears: 'pointed', skinTones: ['pale', 'moon', 'ash', 'bronze', 'obsidian'] },
  { id: 'dwarf', name: 'Nain', desc: 'Robuste, artisan, résistant', baseBody: 'dwarf', build: 'stocky', skinTones: ['pale', 'ruddy', 'bronze', 'earth', 'stone'] },
  { id: 'orc', name: 'Orque', desc: 'Puissant, imposant, fier', baseBody: 'orc', build: 'muscular', skinTones: ['green', 'olive', 'bronze', 'grey', 'obsidian'] },
  { id: 'tiefling', name: 'Tieffelin', desc: 'Héritage infernal, charisme', baseBody: 'human', horns: true, skinTones: ['red', 'violet', 'blue', 'ash', 'pale'] },
  { id: 'halfling', name: 'Halfelin', desc: 'Petit, chanceux, discret', baseBody: 'halfling', height: 'short', skinTones: ['pale', 'peach', 'olive', 'bronze', 'brown'] }
];

// ==========================================================================
// CARNATIONS (Teintes de peau)
// ==========================================================================
const SKIN_TONES = {
  pale:    { name: 'Porcelaine', base: '#f5e6d3', shadow: '#d4c4b0', lip: '#e8b4b4', freckle: '#c9a690' },
  peach:   { name: 'Pêche', base: '#fad6b8', shadow: '#e8b890', lip: '#e8a8a8', freckle: '#d49678' },
  olive:   { name: 'Olive', base: '#d4c4a8', shadow: '#b8a088', lip: '#c8a0a0', freckle: '#a09078' },
  bronze:  { name: 'Bronze', base: '#c49a6c', shadow: '#a07850', lip: '#b88888', freckle: '#8c7058' },
  brown:   { name: 'Ambre', base: '#a07850', shadow: '#785838', lip: '#a87878', freckle: '#685038' },
  dark:    { name: 'Ébène', base: '#684838', shadow: '#483028', lip: '#886060', freckle: '#584030' },
  moon:    { name: 'Clair de Lune', base: '#e8e8f0', shadow: '#c8c8d8', lip: '#d8c8e8', freckle: '#b8b8d0' },
  ash:     { name: 'Cendre', base: '#a8a8b8', shadow: '#888898', lip: '#b8a8c8', freckle: '#787890' },
  obsidian:{ name: 'Obsidienne', base: '#282030', shadow: '#181018', lip: '#584060', freckle: '#382840' },
  ruddy:   { name: 'Rougeaud', base: '#e8a890', shadow: '#c88870', lip: '#d88080', freckle: '#b07060' },
  earth:   { name: 'Terre Cuite', base: '#c88860', shadow: '#a06848', lip: '#b87878', freckle: '#905840' },
  stone:   { name: 'Pierre', base: '#989890', shadow: '#787870', lip: '#a8a0a0', freckle: '#686860' },
  green:   { name: 'Vert Mousse', base: '#6c8c5c', shadow: '#4c6c3c', lip: '#5c7c4c', freckle: '#3c5c2c' },
  red:     { name: 'Rouge Braise', base: '#c85840', shadow: '#a04030', lip: '#b84848', freckle: '#903830' },
  violet:  { name: 'Violet Nuit', base: '#785898', shadow: '#583878', lip: '#9878b8', freckle: '#482868' },
  blue:    { name: 'Bleu Glace', base: '#5888b8', shadow: '#386898', lip: '#78a8d8', freckle: '#285888' }
};

// ==========================================================================
// CORPULENCE / BUILD
// ==========================================================================
const BUILDS = [
  { id: 'slender', name: 'Élancé', desc: 'Fin, agile', bodyScale: { width: .9, torso: .95, limbs: 1.05 } },
  { id: 'average', name: 'Moyen', desc: 'Équilibré', bodyScale: { width: 1, torso: 1, limbs: 1 } },
  { id: 'athletic', name: 'Athlétique', desc: 'Musclé, tonique', bodyScale: { width: 1.05, torso: 1.05, limbs: 1 } },
  { id: 'stocky', name: 'Trapu', desc: 'Large, costaud', bodyScale: { width: 1.15, torso: 1.1, limbs: .95 } },
  { id: 'muscular', name: 'Massif', desc: 'Imposant, puissant', bodyScale: { width: 1.2, torso: 1.15, limbs: 1.05 } },
  { id: 'soft', name: 'Rondouillet', desc: 'Doux, confortable', bodyScale: { width: 1.1, torso: 1.08, limbs: .98 } }
];

// ==========================================================================
// TAILLE / HEIGHT
// ==========================================================================
const HEIGHTS = [
  { id: 'short', name: 'Petit', desc: 'Compact', scale: .92, cameraY: 1.08 },
  { id: 'average', name: 'Standard', desc: 'Moyen', scale: 1, cameraY: 1 },
  { id: 'tall', name: 'Grand', desc: 'Élevé', scale: 1.08, cameraY: .94 },
  { id: 'towering', name: 'Très Grand', desc: 'Imposant', scale: 1.15, cameraY: .88 }
];

// ==========================================================================
// POSTURE
// ==========================================================================
const POSTURES = [
  { id: 'straight', name: 'Droit', desc: 'Fier, confiant', spine: 0, shoulders: 0, head: 0 },
  { id: 'relaxed', name: 'Relâché', desc: 'Décontracté', spine: 3, shoulders: -2, head: 1 },
  { id: 'hunched', name: 'Voûté', desc: 'Protecteur, fatigué', spine: -8, shoulders: -6, head: -4 },
  { id: 'ready', name: 'Sur le qui-vive', desc: 'Prêt à bondir', spine: -2, shoulders: 2, head: 0 },
  { id: 'swagger', name: 'Assuré', desc: 'Nonchalant, cool', spine: 5, shoulders: -4, head: 2 }
];

// ==========================================================================
// FORMES DE VISAGE
// ==========================================================================
const FACE_SHAPES = [
  { id: 'oval', name: 'Ovale', desc: 'Classique, harmonieux', jaw: 0, cheek: 0, chin: 0 },
  { id: 'round', name: 'Rond', desc: 'Doux, juvénile', jaw: -15, cheek: 10, chin: -5 },
  { id: 'square', name: 'Carré', desc: 'Fort, déterminé', jaw: 12, cheek: -5, chin: 8 },
  { id: 'heart', name: 'Cœur', desc: 'Fin, expressif', jaw: -10, cheek: 5, chin: -8 },
  { id: 'diamond', name: 'Diamant', desc: 'Angulaire, aigu', jaw: 5, cheek: 12, chin: 10 },
  { id: 'long', name: 'Allongé', desc: 'Noble, sérieux', jaw: 5, cheek: -5, chin: 12 },
  { id: 'angular', name: 'Anguleux', desc: 'Tranchant, dur', jaw: 15, cheek: -8, chin: 12 }
];

// ==========================================================================
// YEUX (Forme + Couleur)
// ==========================================================================
const EYE_SHAPES = [
  { id: 'almond', name: 'Amandine', desc: 'Classique' },
  { id: 'round', name: 'Rond', desc: 'Ouvert, innocent' },
  { id: 'narrow', name: 'Fendu', desc: 'Intense, méfiant' },
  { id: 'upturned', name: 'Relevé', desc: 'Malicieux, vif' },
  { id: 'downturned', name: 'Tombant', desc: 'Mélancolique, doux' },
  { id: 'hooded', name: 'Paupière lourde', desc: 'Mystérieux, âgé' }
];

const EYE_COLORS = {
  amber:    { name: 'Ambré', iris: '#c89030', sclera: '#fff8e8', glow: '#e8b040' },
  brown:    { name: 'Marron', iris: '#5c3820', sclera: '#fff8f0', glow: '#8c5830' },
  hazel:    { name: 'Noisette', iris: '#7c8c40', sclera: '#fff8e8', glow: '#9cac50' },
  green:    { name: 'Vert', iris: '#3c7c4c', sclera: '#f0fff0', glow: '#50b060' },
  blue:     { name: 'Bleu', iris: '#3868b8', sclera: '#f0f8ff', glow: '#5090e8' },
  gray:     { name: 'Gris', iris: '#787888', sclera: '#f8f8f8', glow: '#9898a8' },
  violet:   { name: 'Violet', iris: '#8858b8', sclera: '#f8f0ff', glow: '#a878d8' },
  red:      { name: 'Rouge', iris: '#b83840', sclera: '#fff0f0', glow: '#d85058' },
  gold:     { name: 'Or', iris: '#d8b020', sclera: '#fffdf0', glow: '#f0d030' },
  heterochromia: { name: 'Hétérochromie', iris: '#3868b8', iris2: '#c89030', sclera: '#fff8f0', glow: '#e8c050' },
  black:    { name: 'Noir', iris: '#181818', sclera: '#f0f0f0', glow: '#383838' },
  white:    { name: 'Blanc (aveugle)', iris: '#f0f0f0', sclera: '#f0f0f0', glow: '#e0e0e0' }
};

// ==========================================================================
// EXPRESSIONS
// ==========================================================================
const EXPRESSIONS = [
  { id: 'neutral', name: 'Neutre', desc: 'Calme, posé', brows: 'flat', eyes: 'open', mouth: 'line' },
  { id: 'determined', name: 'Déterminé', desc: 'Focus, volontaire', brows: 'furrowed', eyes: 'narrow', mouth: 'firm' },
  { id: 'smirk', name: 'Moqueur', desc: 'Amusé, confiant', brows: 'raised', eyes: 'half', mouth: 'smirk' },
  { id: 'kind', name: 'Bienveillant', desc: 'Chaleureux, doux', brows: 'soft', eyes: 'soft', mouth: 'smile' },
  { id: 'stern', name: 'Sévère', desc: 'Autoritaire, dur', brows: 'low', eyes: 'narrow', mouth: 'thin' },
  { id: 'curious', name: 'Curieux', desc: 'Intéressé, éveillé', brows: 'arched', eyes: 'wide', mouth: 'parted' },
  { id: 'weary', name: 'Las', desc: 'Fatigué, usé', brows: 'tired', eyes: 'heavy', mouth: 'downturned' },
  { id: 'fierce', name: 'Féroce', desc: 'Combatif, intense', brows: 'furrowed', eyes: 'glare', mouth: 'grimace' },
  { id: 'dreamy', name: 'Rêveur', desc: 'Absent, poétique', brows: 'relaxed', eyes: 'half', mouth: 'slight' },
  { id: 'cunning', name: 'Rouleur', desc: 'Calculateur, fin', brows: 'asym', eyes: 'narrow', mouth: 'smirk' }
];

// ==========================================================================
// MARQUES & CICATRICES
// ==========================================================================
const MARKS = [
  { id: 'none', name: 'Aucune', svg: '' },
  { id: 'scar-eye', name: 'Cicatrice Œil', desc: 'Traverse le sourcil', svg: '<path d="M85 50 L75 80" stroke="#b03030" stroke-width="2.5" stroke-linecap="round"/><path d="M78 60 L82 62" stroke="#802020" stroke-width="1.5"/><path d="M77 70 L81 71" stroke="#802020" stroke-width="1.5"/>' },
  { id: 'scar-cheek', name: 'Cicatrice Joue', desc: 'Sur la pommette', svg: '<path d="M130 80 L110 95" stroke="#b03030" stroke-width="2" stroke-linecap="round"/><path d="M125 83 L118 88" stroke="#802020" stroke-width="1"/><path d="M122 89 L115 93" stroke="#802020" stroke-width="1"/>' },
  { id: 'scar-lip', name: 'Cicatrice Lèvre', desc: 'Coin de la bouche', svg: '<path d="M100 102 L92 112" stroke="#b03030" stroke-width="2" stroke-linecap="round"/>' },
  { id: 'rune-forehead', name: 'Rune Front', desc: 'Symbole magique', svg: '<path d="M100 40 L100 55 M90 50 L110 50 M95 45 L105 55 M95 55 L105 45" stroke="#e4bf70" stroke-width="2" fill="none" filter="drop-shadow(0 0 4px #e4bf70)"/><circle cx="100" cy="47.5" r="3" fill="#f5d99e"/>' },
  { id: 'rune-cheek', name: 'Rune Joue', desc: 'Marque tribale', svg: '<path d="M130 75 L120 90 L135 85" stroke="#a88cff" stroke-width="1.5" fill="none" filter="drop-shadow(0 0 3px #a88cff)"/><circle cx="127.5" cy="83" r="2" fill="#c8b8ff"/>' },
  { id: 'freckles', name: 'Rousseurs', desc: 'Naturelles, solaires', svg: '<g fill="#b89060"><circle cx="82" cy="78" r="1.2"/><circle cx="88" cy="76" r="1"/><circle cx="94" cy="79" r="1.2"/><circle cx="108" cy="77" r="1"/><circle cx="114" cy="75" r="1.2"/><circle cx="120" cy="78" r="1"/></g>' },
  { id: 'moles', name: 'Grains de beauté', desc: 'Quelques marques', svg: '<g fill="#483028"><circle cx="85" cy="72" r="1.5"/><circle cx="112" cy="85" r="1.2"/><circle cx="98" cy="65" r="1"/></g>' },
  { id: 'tattoo-face', name: 'Tatouage Visage', desc: 'Lignes rituelles', svg: '<path d="M70 60 L60 85 M75 58 L65 82 M80 56 L70 80" stroke="#382820" stroke-width="1.5" stroke-linecap="round"/>' },
  { id: 'vitiligo', name: 'Vitiligo', desc: 'Taches dépigmentées', svg: '<g fill="#f0e8d8" opacity=".7"><path d="M85 65 Q95 70 88 82 Q98 78 85 65"/><path d="M115 70 Q122 78 118 88 Q125 82 115 70"/></g>' },
  { id: 'warpaint', name: 'Peinture de Guerre', desc: 'Lignes rituelles colorées', svg: '<path d="M65 55 L135 55" stroke="#e4bf70" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M65 105 L135 105" stroke="#e4bf70" stroke-width="2" stroke-linecap="round" opacity=".6"/>' }
];

// ==========================================================================
// PILOSITÉ FACIALE
// ==========================================================================
const FACIAL_HAIR = [
  { id: 'none', name: 'Rasé de près', svg: '' },
  { id: 'stubble', name: 'Barbe de 3 jours', desc: 'Léger duvet', svg: '<g fill="#483830" opacity=".4"><circle cx="85" cy="100" r="1"/><circle cx="95" cy="102" r="1"/><circle cx="105" cy="100" r="1"/><circle cx="115" cy="102" r="1"/><circle cx="90" cy="108" r="1"/><circle cx="100" cy="110" r="1"/><circle cx="110" cy="108" r="1"/></g>' },
  { id: 'goatee', name: 'Bouc', desc: 'Menton seulement', svg: '<path d="M92 100 Q100 125 108 100 Q100 115 92 100" fill="#382820"/><path d="M90 90 Q100 85 110 90" fill="#382820"/>' },
  { id: 'beard-short', name: 'Barbe Courte', desc: 'Bien taillée', svg: '<path d="M70 95 Q70 135 100 140 Q130 135 130 95 L125 95 Q125 130 100 135 Q75 130 75 95 Z" fill="#302420"/>' },
  { id: 'beard-full', name: 'Barbe Fournie', desc: 'Longue, épaisse', svg: '<path d="M65 95 Q60 150 100 158 Q140 150 135 95 L130 95 Q130 148 100 155 Q70 148 70 95 Z" fill="#282018"/><path d="M100 158 Q100 175 100 185" stroke="#282018" stroke-width="8" stroke-linecap="round"/>' },
  { id: 'beard-braided', name: 'Barbe Tressée', desc: 'Style nain/guerrier', svg: '<path d="M65 95 Q70 135 100 140 Q130 135 135 95 L130 95 Q125 130 100 135 Q75 130 75 95 Z" fill="#302420"/><path d="M100 140 Q95 160 100 180 Q105 160 100 140" fill="#282018"/><circle cx="100" cy="160" r="4" fill="#e4bf70"/>' },
  { id: 'mustache', name: 'Moustache', desc: 'Seule', svg: '<path d="M85 92 Q100 88 115 92 Q110 98 100 102 Q90 98 85 92" fill="#302420"/>' },
  { id: 'mustache-handlebar', name: 'Moustache Guidon', desc: 'Pointes relevées', svg: '<path d="M85 92 Q80 85 75 88 Q70 85 65 92" fill="#302420"/><path d="M115 92 Q120 85 125 88 Q130 85 135 92" fill="#302420"/><path d="M95 92 Q100 96 105 92" fill="#302420"/>' },
  { id: 'sideburns', name: 'Favoris', desc: 'Longs sur les joues', svg: '<path d="M62 70 L55 110 L65 110 L70 70 Z" fill="#302420"/><path d="M138 70 L145 110 L135 110 L130 70 Z" fill="#302420"/>' }
];

// ==========================================================================
// WARPAINT / MAQUILLAGE
// ==========================================================================
const WARPAINTS = [
  { id: 'none', name: 'Aucun', svg: '' },
  { id: 'tribal-lines', name: 'Lignes Tribales', desc: 'Traits sur les joues', svg: '<path d="M70 75 L55 90 M75 78 L60 93 M80 80 L65 95" stroke="#e4bf70" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M130 75 L145 90 M125 78 L140 93 M120 80 L135 95" stroke="#e4bf70" stroke-width="2" stroke-linecap="round" opacity=".8"/>' },
  { id: 'eye-mask', name: 'Masque Yeux', desc: 'Autour des yeux', svg: '<path d="M65 55 Q100 45 135 55 Q130 65 100 70 Q70 65 65 55" fill="#181020" opacity=".6"/><path d="M65 55 Q100 45 135 55" stroke="#e4bf70" stroke-width="1.5" opacity=".8"/>' },
  { id: 'forehead-mark', name: 'Marque Front', desc: 'Symbole central', svg: '<path d="M100 35 L100 55 M90 45 L110 45 M95 40 L105 50 M95 50 L105 40" stroke="#a88cff" stroke-width="2" fill="none" filter="drop-shadow(0 0 4px #a88cff)"/><circle cx="100" cy="45" r="3" fill="#c8b8ff"/>' },
  { id: 'full-face', name: 'Visage Complet', desc: 'Peinture guerrière', svg: '<path d="M60 50 Q100 30 140 50" stroke="#b03030" stroke-width="4" fill="none" opacity=".7"/><path d="M60 100 Q100 110 140 100" stroke="#b03030" stroke-width="3" fill="none" opacity=".5"/><path d="M90 70 Q100 80 110 70" stroke="#b03030" stroke-width="2" fill="none" opacity=".6"/>' },
  { id: 'clown', name: 'Arlequin', desc: 'Ludique, théâtral', svg: '<path d="M80 50 Q80 40 90 45 Q100 40 100 50" fill="#e4bf70" opacity=".8"/><path d="M110 50 Q110 40 120 45 Q130 40 130 50" fill="#a88cff" opacity=".8"/><circle cx="85" cy="105" r="4" fill="#b03030"/><circle cx="115" cy="105" r="4" fill="#b03030"/>' },
  { id: 'geometric', name: 'Géométrique', desc: 'Lignes pures', svg: '<rect x="70" y="55" width="60" height="2" fill="#e4bf70" opacity=".7"/><rect x="70" y="100" width="60" height="2" fill="#e4bf70" opacity=".7"/><line x1="100" y1="55" x2="100" y2="100" stroke="#e4bf70" stroke-width="2" opacity=".7"/>' },
  { id: 'glitter', name: 'Paillettes', desc: 'Féérique, brillant', svg: '<g fill="#f5d99e" filter="drop-shadow(0 0 3px #f5d99e)"><circle cx="78" cy="58" r="1.5"/><circle cx="122" cy="58" r="1.5"/><circle cx="75" cy="85" r="1"/><circle cx="125" cy="85" r="1"/><circle cx="90" cy="68" r="1"/><circle cx="110" cy="68" r="1"/><circle cx="100" cy="95" r="1.5"/></g>' }
];

// ==========================================================================
// COIFFURES
// ==========================================================================
const HAIRSTYLES = [
  { id: 'bald', name: 'Chauve / Rasé', desc: 'Aucun cheveu', gender: 'all', svg: '<path d="M70 40 Q100 28 130 40" stroke="rgba(255,255,255,.3)" stroke-width="1.5" fill="none"/>' },
  { id: 'buzz', name: 'Coupe Militaire', desc: 'Très court, uniforme', gender: 'all', svg: '<path d="M68 42 Q100 30 132 42 L132 58 Q100 62 68 58 Z" fill="currentColor"/>' },
  { id: 'crew', name: 'Coupe Court', desc: 'Classique, net', gender: 'all', svg: '<path d="M65 40 C60 25 90 20 100 20 C110 20 140 25 135 40 L135 55 Q100 65 65 55 Z" fill="currentColor"/><path d="M100 20 C100 35 90 35 90 20" stroke="currentColor" stroke-width="2" opacity=".3"/>' },
  { id: 'textured-crop', name: 'Crop Texturé', desc: 'Court, désordonné', gender: 'all', svg: '<path d="M65 38 C60 22 85 18 100 18 C115 18 140 22 135 38 L135 52 Q100 60 65 52 Z" fill="currentColor"/><g fill="currentColor" opacity=".4"><path d="M75 28 Q85 20 95 28"/><path d="M95 28 Q105 20 115 28"/><path d="M85 32 Q95 24 105 32"/></g>' },
  { id: 'side-part', name: 'Râteau Côté', desc: 'Classique, élégant', gender: 'all', svg: '<path d="M65 38 C60 25 85 22 100 20 C115 22 140 25 135 38 L135 55 Q100 65 65 55 Z" fill="currentColor"/><path d="M80 38 Q85 30 92 38" stroke="currentColor" stroke-width="2" opacity=".4"/><path d="M92 38 Q100 45 108 38" stroke="currentColor" stroke-width="2" opacity=".4"/>' },
  { id: 'pompadour', name: 'Pompadour', desc: 'Volume sur le devant', gender: 'all', svg: '<path d="M65 30 C55 10 85 5 100 5 C115 5 145 10 135 30 L135 50 Q100 60 65 50 Z" fill="currentColor"/><path d="M75 30 Q90 10 110 25" stroke="currentColor" stroke-width="3" opacity=".3"/>' },
  { id: 'quiff', name: 'Houppe / Quiff', desc: 'Moderne, stylé', gender: 'all', svg: '<path d="M65 35 C58 18 90 12 100 12 C110 12 142 18 135 35 L135 52 Q100 62 65 52 Z" fill="currentColor"/><path d="M80 35 Q90 20 105 30" stroke="currentColor" stroke-width="3" opacity=".3"/><path d="M105 30 Q115 20 125 30" stroke="currentColor" stroke-width="2" opacity=".3"/>' },
  { id: 'messy-short', name: 'Court Ébouriffé', desc: 'Naturel, décontracté', gender: 'all', svg: '<path d="M68 38 C62 25 85 20 100 20 C115 20 138 25 132 38 L132 52 Q100 60 68 52 Z" fill="currentColor"/><g fill="currentColor" opacity=".4"><path d="M75 28 Q82 22 90 28"/><path d="M95 26 Q102 18 110 26"/><path d="M110 28 Q117 22 125 28"/></g>' },
  { id: 'curly-short', name: 'Boucles Courtes', desc: 'Naturelles, volumineuses', gender: 'all', svg: '<g fill="currentColor"><circle cx="80" cy="38" r="16"/><circle cx="100" cy="32" r="18"/><circle cx="120" cy="38" r="16"/><circle cx="90" cy="52" r="14"/><circle cx="110" cy="52" r="14"/></g>' },
  { id: 'afro-short', name: 'Afro Court', desc: 'Naturel, dense', gender: 'all', svg: '<path d="M60 40 C55 25 85 20 100 20 C115 20 145 25 140 40 C150 55 135 70 120 75 C105 80 95 80 80 75 C65 70 50 55 60 40 Z" fill="currentColor"/>' },
  { id: 'medium-messy', name: 'Mi-Long Ébouriffé', desc: 'Décontracté, rock', gender: 'all', svg: '<path d="M55 40 C48 25 80 20 100 18 C120 20 152 25 145 40 L145 85 Q100 100 55 85 Z" fill="currentColor"/><g fill="currentColor" opacity=".4"><path d="M70 30 Q80 22 90 30"/><path d="M95 26 Q105 18 115 26"/><path d="M115 30 Q125 22 135 30"/></g>' },
  { id: 'shoulder-length', name: 'Longueur Épaules', desc: 'Polyvalent', gender: 'all', svg: '<path d="M50 38 C42 22 75 18 100 16 C125 18 158 22 150 38 L150 105 Q100 115 50 105 Z" fill="currentColor"/><path d="M75 38 Q85 30 95 38" stroke="currentColor" stroke-width="2" opacity=".3"/>' },
  { id: 'long-straight', name: 'Long Lisse', desc: 'Élégant, fluide', gender: 'all', svg: '<path d="M48 35 C38 18 70 14 100 12 C130 14 162 18 152 35 L152 140 Q100 150 48 140 Z" fill="currentColor"/><path d="M70 35 Q80 25 90 35" stroke="currentColor" stroke-width="2" opacity=".3"/><path d="M110 35 Q120 25 130 35" stroke="currentColor" stroke-width="2" opacity=".3"/>' },
  { id: 'long-wavy', name: 'Long Ondulé', desc: 'Naturel, mouvement', gender: 'all', svg: '<path d="M45 35 C38 20 70 18 100 16 C130 18 162 20 155 35 Q158 55 155 75 Q158 95 155 115 Q152 135 145 140 Q100 150 48 140 Q42 135 38 115 Q35 95 38 75 Q35 55 38 35 Q42 18 45 35 Z" fill="currentColor"/>' },
  { id: 'long-curly', name: 'Long Bouclé', desc: 'Volumineux, sauvage', gender: 'all', svg: '<g fill="currentColor"><circle cx="70" cy="40" r="20"/><circle cx="100" cy="32" r="22"/><circle cx="130" cy="40" r="20"/><circle cx="60" cy="70" r="18"/><circle cx="140" cy="70" r="18"/><circle cx="90" cy="95" r="18"/><circle cx="110" cy="95" r="18"/><circle cx="80" cy="120" r="16"/><circle cx="120" cy="120" r="16"/></g>' },
  { id: 'braids', name: 'Tresses', desc: 'Style protecteur', gender: 'all', svg: '<g fill="currentColor"><path d="M55 38 Q50 60 55 85 Q52 70 55 85"/><path d="M70 36 Q65 58 70 83 Q67 68 70 83"/><path d="M85 35 Q80 57 85 82 Q83 67 85 82"/><path d="M100 34 Q95 56 100 81 Q98 66 100 81"/><path d="M115 35 Q110 57 115 82 Q113 67 115 82"/><path d="M130 36 Q125 58 130 83 Q128 68 130 83"/><path d="M145 38 Q140 60 145 85 Q142 70 145 85"/></g>' },
  { id: 'dreads', name: 'Dreadlocks', desc: 'Naturel, spirituel', gender: 'all', svg: '<g fill="currentColor"><path d="M55 38 L52 120"/><path d="M70 36 L68 120"/><path d="M85 35 L84 120"/><path d="M100 34 L100 120"/><path d="M115 35 L116 120"/><path d="M130 36 L132 120"/><path d="M145 38 L148 120"/></g>' },
  { id: 'topknot', name: 'Chignon Haut', desc: 'Samouraï, pratique', gender: 'all', svg: '<path d="M60 40 C55 25 85 22 100 22 C115 22 145 25 140 40 L140 55 Q100 65 60 55 Z" fill="currentColor"/><circle cx="100" cy="15" r="20" fill="currentColor"/><circle cx="100" cy="15" r="12" fill="currentColor" opacity=".4"/><line x1="90" y1="15" x2="110" y2="15" stroke="#e4bf70" stroke-width="3" stroke-linecap="round"/>' },
  { id: 'half-up', name: 'Demi-Queue', desc: 'Polyvalent', gender: 'all', svg: '<path d="M55 38 C48 22 80 18 100 16 C120 18 152 22 145 38 L145 105 Q100 115 55 105 Z" fill="currentColor"/><circle cx="100" cy="30" r="16" fill="currentColor"/><circle cx="100" cy="30" r="9" fill="currentColor" opacity=".4"/>' },
  { id: 'ponytail-high', name: 'Queue de Cheval Haute', desc: 'Sportive, énergique', gender: 'all', svg: '<path d="M60 38 C55 22 85 18 100 16 C115 18 145 22 140 38 L140 50 Q100 58 60 50 Z" fill="currentColor"/><path d="M100 40 Q105 70 100 100 Q95 70 90 40 Z" fill="currentColor"/><path d="M95 40 Q100 70 105 40" stroke="currentColor" stroke-width="2" opacity=".3"/>' },
  { id: 'ponytail-low', name: 'Queue de Cheval Basse', desc: 'Décontractée', gender: 'all', svg: '<path d="M58 38 C52 22 82 18 100 16 C118 18 148 22 144 38 L144 85 Q100 95 58 85 Z" fill="currentColor"/><path d="M100 85 Q105 115 100 140 Q95 115 90 85 Z" fill="currentColor"/>' },
  { id: 'bun', name: 'Chignon Bas', desc: 'Élégant, formel', gender: 'all', svg: '<path d="M55 38 C48 22 80 18 100 16 C120 18 152 22 145 38 L145 75 Q100 85 55 75 Z" fill="currentColor"/><ellipse cx="100" cy="88" rx="18" ry="14" fill="currentColor"/><ellipse cx="100" cy="88" rx="11" ry="8" fill="currentColor" opacity=".4"/>' },
  { id: 'mohawk', name: 'Mohawk / Iroquois', desc: 'Rebelle, punk', gender: 'all', svg: '<path d="M90 40 C85 15 100 10 100 10 C100 10 115 15 110 40 L110 55 Q100 62 90 55 Z" fill="currentColor"/><path d="M100 10 Q102 30 100 55" stroke="currentColor" stroke-width="4" opacity=".3"/>' },
  { id: 'faux-hawk', name: 'Faux Hawk', desc: 'Moderne, stylé', gender: 'all', svg: '<path d="M75 38 C70 20 90 15 100 15 C110 15 130 20 125 38 L125 52 Q100 60 75 52 Z" fill="currentColor"/><path d="M100 15 Q102 30 100 50" stroke="currentColor" stroke-width="3" opacity=".3"/>' },
  { id: 'wolf-cut', name: 'Wolf Cut', desc: 'Tendance, dégradé', gender: 'all', svg: '<path d="M58 38 C50 22 80 16 100 14 C120 16 150 22 142 38 L142 80 Q100 90 58 80 Z" fill="currentColor"/><g fill="currentColor" opacity=".4"><path d="M70 28 Q78 20 86 28"/><path d="M92 24 Q100 16 108 24"/><path d="M114 28 Q122 20 130 28"/></g>' },
  { id: 'shag', name: 'Shag / Dégradé', desc: 'Rock, années 70', gender: 'all', svg: '<path d="M55 38 C48 20 78 15 100 14 C122 15 152 20 145 38 L145 90 Q100 100 55 90 Z" fill="currentColor"/><g fill="currentColor" opacity=".4"><path d="M70 30 Q78 22 86 30"/><path d="M94 26 Q102 18 110 26"/><path d="M114 30 Q122 22 130 30"/></g>' },
  { id: 'asymmetrical', name: 'Asymétrique', desc: 'Avant-gardiste', gender: 'all', svg: '<path d="M58 38 C50 20 75 15 95 14 C115 15 145 20 140 38 L140 55 Q100 65 58 55 Z" fill="currentColor"/><path d="M95 14 Q105 25 130 30 Q125 40 115 55" stroke="currentColor" stroke-width="4" opacity=".4"/>' }
];

// ==========================================================================
// COULEURS CHEVEUX
// ==========================================================================
const HAIR_COLORS = {
  black:       { name: 'Noir Corbeau', base: '#1a1a2e', highlight: '#2a2a4a', tone: 'cool' },
  darkbrown:   { name: 'Brun Très Foncé', base: '#2d1b15', highlight: '#4a2c1f', tone: 'warm' },
  brown:       { name: 'Brun Sombre', base: '#3d2818', highlight: '#5d3a24', tone: 'warm' },
  chestnut:    { name: 'Châtain', base: '#5d3a24', highlight: '#8b5a3a', tone: 'warm' },
  lightbrown:  { name: 'Brun Clair', base: '#7a5230', highlight: '#a87048', tone: 'warm' },
  auburn:      { name: 'Auburn / Roux Brun', base: '#7a3018', highlight: '#b84820', tone: 'warm' },
  red:         { name: 'Roux Flamboyant', base: '#b83018', highlight: '#e85028', tone: 'warm' },
  copper:      { name: 'Cuivré', base: '#b85820', highlight: '#e88038', tone: 'warm' },
  strawberry:  { name: 'Blond Fraise', base: '#d88060', highlight: '#f8b090', tone: 'warm' },
  darkblonde:  { name: 'Blond Foncé', base: '#b89048', highlight: '#d8b068', tone: 'warm' },
  blonde:      { name: 'Blond', base: '#d8b058', highlight: '#f8d880', tone: 'warm' },
  platinum:    { name: 'Blond Platine', base: '#f0e8d0', highlight: '#fff8e8', tone: 'cool' },
  white:       { name: 'Blanc Pur', base: '#f8f8f0', highlight: '#ffffff', tone: 'cool' },
  silver:      { name: 'Argenté', base: '#c8c8d0', highlight: '#f0f0f8', tone: 'cool' },
  blueblack:   { name: 'Bleu-Noir', base: '#181830', highlight: '#282850', tone: 'cool' },
  blue:        { name: 'Bleu Mystique', base: '#183860', highlight: '#3868a0', tone: 'cool' },
  teal:        { name: 'Sarcelle', base: '#186060', highlight: '#38a0a0', tone: 'cool' },
  green:       { name: 'Vert Nature', base: '#205030', highlight: '#409050', tone: 'cool' },
  purple:      { name: 'Violet Rêve', base: '#402050', highlight: '#704090', tone: 'cool' },
  pink:        { name: 'Rose Pastel', base: '#b86080', highlight: '#e890b0', tone: 'warm' },
  pastelblue:  { name: 'Bleu Pastel', base: '#70a0d0', highlight: '#a0c8f0', tone: 'cool' },
  pastelpurple:{ name: 'Violet Pastel', base: '#b080d0', highlight: '#d0b0f0', tone: 'cool' },
  pastelpink:  { name: 'Rose Pastel', base: '#e090b0', highlight: '#f0c0d8', tone: 'warm' },
  pastelgreen: { name: 'Vert Pastel', base: '#80c090', highlight: '#b0f0c8', tone: 'cool' },
  ombre_fire:  { name: 'Ombre Feu', base: '#3d1810', highlight: '#e84018', tone: 'warm', gradient: true },
  ombre_ocean: { name: 'Ombre Océan', base: '#102840', highlight: '#2080c0', tone: 'cool', gradient: true },
  ombre_forest:{ name: 'Ombre Forêt', base: '#183018', highlight: '#40a040', tone: 'cool', gradient: true },
  ombre_sunset:{ name: 'Ombre Coucher', base: '#402010', highlight: '#f08030', tone: 'warm', gradient: true },
  rainbow:     { name: 'Arc-en-ciel', base: '#ff0080', highlight: '#00ffff', tone: 'warm', gradient: 'rainbow' }
};

// ==========================================================================
// REFLETS / MÈCHES
// ==========================================================================
const HAIR_HIGHLIGHTS = [
  { id: 'none', name: 'Aucun', color: 'transparent' },
  { id: 'golden', name: 'Doré', color: '#f5d99e' },
  { id: 'silver', name: 'Argenté', color: '#e8e8f0' },
  { id: 'copper', name: 'Cuivré', color: '#c86028' },
  { id: 'rose', name: 'Rose', color: '#e8a0c0' },
  { id: 'blue', name: 'Bleu', color: '#60a0e8' },
  { id: 'green', name: 'Vert', color: '#60c870' },
  { id: 'purple', name: 'Violet', color: '#b880e8' },
  { id: 'red', name: 'Rouge', color: '#e84050' },
  { id: 'pink', name: 'Rose Pâle', color: '#f0c0d8' },
  { id: 'teal', name: 'Sarcelle', color: '#40c8c8' },
  { id: 'white', name: 'Blanc', color: '#f8f8f0' }
];

// ==========================================================================
// TENUES PAR CLASSE
// ==========================================================================
const OUTFITS = {
  paladin: [
    { id: 'plate-gold', name: 'Plates Dorées', desc: 'Classique, brillante', svg: 'plate-gold' },
    { id: 'plate-white', name: 'Plates Blanches', desc: 'Pure, immaculée', svg: 'plate-white' },
    { id: 'plate-black', name: 'Plates Noires', desc: 'Sombre, imposante', svg: 'plate-black' },
    { id: 'plate-ornate', name: 'Plates Cisellées', desc: 'Ornées, rituelles', svg: 'plate-ornate' },
    { id: 'half-plate', name: 'Demi-Plates', desc: 'Mobile, pratique', svg: 'half-plate' },
    { id: 'crusader', name: 'Croisé', desc: 'Surcot blanc, croix rouge', svg: 'crusader' }
  ],
  ranger: [
    { id: 'leather-green', name: 'Cuir Forestier', desc: 'Camouflage naturel', svg: 'leather-green' },
    { id: 'leather-brown', name: 'Cuir Brun', desc: 'Classique, usé', svg: 'leather-brown' },
    { id: 'cloak-hood', name: 'Cape à Capuche', desc: 'Furtive, chaude', svg: 'cloak-hood' },
    { id: 'studded', name: 'Cuir Clouté', desc: 'Renforcé, défensif', svg: 'studded' },
    { id: 'ranger-dark', name: 'Sombre', desc: 'Nuit, ombre', svg: 'ranger-dark' },
    { id: 'wild', name: 'Sauvage', desc: 'Peaux, os, nature', svg: 'wild' }
  ],
  bard: [
    { id: 'velvet-red', name: 'Velours Rouge', desc: 'Passion, scène', svg: 'velvet-red' },
    { id: 'velvet-blue', name: 'Velours Bleu', desc: 'Noble, mystique', svg: 'velvet-blue' },
    { id: 'velvet-purple', name: 'Velours Violet', desc: 'Magique, rêve', svg: 'velvet-purple' },
    { id: 'doublet-gold', name: 'Doublet Doré', desc: 'Riche, flamboyant', svg: 'doublet-gold' },
    { id: 'harlequin', name: 'Arlequin', desc: 'Coloré, théâtral', svg: 'harlequin' },
    { id: 'minstrel', name: 'Ménestrel', desc: 'Simple, authentique', svg: 'minstrel' }
  ],
  alchemist: [
    { id: 'apron-leather', name: 'Tablier Cuir', desc: 'Pratique, taché', svg: 'apron-leather' },
    { id: 'apron-cloth', name: 'Tablier Toile', desc: 'Propre, fonctionnel', svg: 'apron-cloth' },
    { id: 'robe-alchemist', name: 'Robe Alchimique', desc: 'Longue, poches', svg: 'robe-alchemist' },
    { id: 'coat-long', name: 'Long Manteau', desc: 'Protection, style', svg: 'coat-long' },
    { id: 'apron-heavy', name: 'Tablier Lourd', desc: 'Renforcé, industriel', svg: 'apron-heavy' },
    { id: 'scholar', name: 'Savant', desc: 'Érudit, sobre', svg: 'scholar' }
  ]
};

// ==========================================================================
// COUVRE-CHEFS
// ==========================================================================
const HEADGEAR = [
  { id: 'none', name: 'Aucun', svg: '' },
  { id: 'circlet', name: 'Serre-tête / Diadème', svg: '<ellipse cx="100" cy="38" rx="35" ry="4" fill="none" stroke="#e4bf70" stroke-width="3"/><circle cx="100" cy="38" r="5" fill="#f5d99e"/>' },
  { id: 'crown-simple', name: 'Couronne Simple', svg: '<path d="M70 40 L75 25 L80 40 L85 25 L90 40 L95 25 L100 40 L105 25 L110 40 L115 25 L120 40 L125 25 L130 40" fill="none" stroke="#e4bf70" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="25" r="4" fill="#f5d99e"/>' },
  { id: 'crown-ornate', name: 'Couronne Ornée', svg: '<path d="M65 42 L72 20 L79 42 L86 18 L93 42 L100 15 L107 42 L114 18 L121 42 L128 20 L135 42" fill="none" stroke="#e4bf70" stroke-width="3"/><circle cx="100" cy="15" r="5" fill="#f5d99e"/><circle cx="86" cy="18" r="3" fill="#e86060"/><circle cx="114" cy="18" r="3" fill="#60a0e8"/>' },
  { id: 'helmet-open', name: 'Heaum Ouvert', svg: '<path d="M60 45 L55 30 Q80 20 120 20 Q145 20 140 30 L135 45" fill="#484850" stroke="#787890" stroke-width="2"/><path d="M65 45 L65 60 L135 60 L135 45" fill="#383848"/>' },
  { id: 'helmet-full', name: 'Grande Heaume', svg: '<path d="M55 42 L50 20 Q100 10 150 20 L145 42" fill="#383840" stroke="#686878" stroke-width="2"/><rect x="70" y="28" width="60" height="8" fill="#181820"/>' },
  { id: 'hood-up', name: 'Capuche Relevée', svg: '<path d="M55 45 Q50 20 100 15 Q150 20 145 45 Q140 60 100 70 Q60 60 55 45" fill="#282830" stroke="#484850" stroke-width="1"/>' },
  { id: 'hood-down', name: 'Capuche Baissée', svg: '<path d="M50 50 Q50 35 100 30 Q150 35 150 50" fill="#282830" stroke="#484850" stroke-width="1"/><path d="M60 50 Q80 55 100 52 Q120 55 140 50" fill="none" stroke="#484850" stroke-width="1" stroke-dasharray="4 4"/>' },
  { id: 'hat-wide', name: 'Chapeau à Large Bord', svg: '<ellipse cx="100" cy="20" rx="55" ry="8" fill="#281810" stroke="#483020" stroke-width="2"/><path d="M70 30 Q100 10 130 30" fill="#281810" stroke="#483020" stroke-width="2"/><ellipse cx="100" cy="30" rx="18" ry="8" fill="#181008"/>' },
  { id: 'tricorne', name: 'Tricorne', svg: '<path d="M50 35 Q65 15 100 12 Q135 15 150 35" fill="#181008" stroke="#382010" stroke-width="2"/><path d="M50 35 Q80 28 100 32 Q120 28 150 35" fill="none" stroke="#382010" stroke-width="1"/>' },
  { id: 'bandana', name: 'Bandana', svg: '<path d="M55 40 Q100 28 145 40 Q140 50 100 55 Q60 50 55 40" fill="#802020" stroke="#b03030" stroke-width="1"/><path d="M145 40 Q155 45 145 55" fill="#802020" stroke="#b03030" stroke-width="1"/>' },
  { id: 'headband', name: 'Bandeau', svg: '<ellipse cx="100" cy="40" rx="45" ry="6" fill="#382820" stroke="#583828" stroke-width="1"/>' },
  { id: 'feathers', name: 'Plumes', svg: '<g fill="#e4bf70" filter="drop-shadow(0 0 3px #e4bf70)"><path d="M85 35 Q80 25 75 35 Q70 25 65 35"/><path d="M115 35 Q120 25 125 35 Q130 25 135 35"/></g>' },
  { id: 'horns-small', name: 'Petites Cornes', svg: '<path d="M75 38 Q70 15 75 25 Q80 15 75 38" fill="#382820" stroke="#584030" stroke-width="1"/><path d="M125 38 Q130 15 125 25 Q120 15 125 38" fill="#382820" stroke="#584030" stroke-width="1"/>' },
  { id: 'horns-large', name: 'Grandes Cornes', svg: '<path d="M70 35 Q55 0 70 15 Q85 0 70 35" fill="#281818" stroke="#483028" stroke-width="1.5"/><path d="M130 35 Q145 0 130 15 Q115 0 130 35" fill="#281818" stroke="#483028" stroke-width="1.5"/>' }
];

// ==========================================================================
// ARTEFACTS EN MAIN
// ==========================================================================
const ARTIFACTS = [
  { id: 'none', name: 'Rien', svg: '' },
  { id: 'scroll', name: 'Parchemin Runique', svg: '<g transform="translate(150, 120) rotate(-15)"><rect x="0" y="0" width="38" height="48" rx="3" fill="#fef3c7" stroke="#b45309" stroke-width="2"/><line x1="5" y1="12" x2="28" y2="7" stroke="#b45309" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="20" x2="26" y2="15" stroke="#b45309" stroke-width="2" stroke-linecap="round"/><line x1="7" y1="28" x2="24" y2="23" stroke="#b45309" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="38" r="4" fill="#dc2626"/></g>' },
  { id: 'dagger', name: 'Dague Runique', svg: '<g transform="translate(160, 110) rotate(-25)"><polygon points="12,0 18,35 6,35" fill="#38bdf8" filter="drop-shadow(0 0 5px #38bdf8)"/><rect x="2" y="35" width="20" height="4" fill="#f59e0b" rx="1"/><rect x="9" y="39" width="6" height="15" fill="#78350f"/><circle cx="12" cy="56" r="3.5" fill="#f59e0b"/></g>' },
  { id: 'sword', name: 'Épée Longue', svg: '<g transform="translate(155, 90) rotate(-20)"><rect x="11" y="0" width="4" height="80" fill="#c8c8d0"/><polygon points="9,0 13,0 15,5 11,5" fill="#e4bf70"/><rect x="7" y="75" width="12" height="12" fill="#78350f" rx="2"/><circle cx="13" cy="83" r="5" fill="#e4bf70"/></g>' },
  { id: 'staff', name: 'Bâton Magique', svg: '<g transform="translate(165, 80) rotate(-10)"><rect x="11" y="0" width="4" height="110" fill="#583820"/><ellipse cx="13" cy="10" rx="8" ry="5" fill="#a88cff" filter="drop-shadow(0 0 6px #a88cff)"/><circle cx="13" cy="10" r="3" fill="#f5d99e"/></g>' },
  { id: 'orb', name: 'Orbe de Pouvoir', svg: '<g transform="translate(160, 120)"><circle cx="0" cy="0" r="18" fill="#181830" stroke="#a88cff" stroke-width="2" filter="drop-shadow(0 0 10px #a88cff)"/><circle cx="0" cy="0" r="10" fill="#a88cff" opacity=".3"/><circle cx="-3" cy="-3" r="4" fill="#f5d99e"/></g>' },
  { id: 'potion', name: 'Fiole Alchimique', svg: '<g transform="translate(155, 125)"><path d="M0 0 L6 0 L6 8 L10 22 C12 28 6 34 0 34 C-6 34 -12 28 -10 22 L-6 8 L0 0 Z" fill="#4ade80" stroke="#166534" stroke-width="2" filter="drop-shadow(0 0 7px #4ade80)"/><rect x="-1" y="-3" width="8" height="4" fill="#78350f" rx="1"/><circle cx="1" cy="18" r="2.5" fill="#fff" opacity=".7"/><circle cx="-2" cy="12" r="1.5" fill="#fff" opacity=".7"/></g>' },
  { id: 'quill', name: 'Calame Doré', svg: '<g transform="translate(165, 105) rotate(-35)"><path d="M0 0 C15 20 12 45 0 60 C-12 45 -15 20 0 0 Z" fill="#f59e0b" filter="drop-shadow(0 0 5px #fef08a)"/><line x1="0" y1="5" x2="0" y2="62" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="63" r="2" fill="#f59e0b"/></g>' },
  { id: 'lute', name: 'Luth de Barde', svg: '<g transform="translate(140, 130) rotate(15)"><ellipse cx="0" cy="0" rx="22" ry="35" fill="#8b5a30" stroke="#583018" stroke-width="2"/><ellipse cx="0" cy="0" rx="12" ry="20" fill="#583018"/><rect x="-2" y="-35" width="4" height="45" fill="#382010"/><line x1="-8" y1="-10" x2="8" y2="-10" stroke="#e4bf70" stroke-width="1"/><line x1="-8" y1="0" x2="8" y2="0" stroke="#e4bf70" stroke-width="1"/><line x1="-8" y1="10" x2="8" y2="10" stroke="#e4bf70" stroke-width="1"/></g>' },
  { id: 'bow', name: 'Arc Composite', svg: '<g transform="translate(135, 90) rotate(-30)"><path d="M0 -60 Q30 -80 30 -40 Q30 -20 0 0 Q-30 -20 -30 -40 Q-30 -80 0 -60" fill="none" stroke="#583010" stroke-width="5"/><line x1="0" y1="-60" x2="0" y2="60" stroke="#e4bf70" stroke-width="2"/></g>' },
  { id: 'hammer', name: 'Marteau de Guerre', svg: '<g transform="translate(155, 95) rotate(-15)"><rect x="8" y="0" width="8" height="50" fill="#583010"/><rect x="4" y="50" width="16" height="12" fill="#383840" stroke="#686878" stroke-width="2"/><rect x="0" y="62" width="24" height="6" fill="#282830"/></g>' },
  { id: 'shield', name: 'Bouclier', svg: '<g transform="translate(130, 110)"><path d="M0 -40 L25 -20 L25 40 L0 60 L-25 40 L-25 -20 Z" fill="#283848" stroke="#5888b8" stroke-width="3"/><circle cx="0" cy="10" r="12" fill="none" stroke="#e4bf70" stroke-width="2"/><path d="M0 -15 L0 35 M-15 10 L15 10" stroke="#e4bf70" stroke-width="2"/></g>' },
  { id: 'torch', name: 'Torche', svg: '<g transform="translate(160, 80)"><rect x="-2" y="0" width="4" height="50" fill="#382818"/><path d="M-8 0 Q-12 -20 0 -40 Q12 -20 8 0" fill="#e86020" filter="drop-shadow(0 0 10px #e86020)"/><path d="M-4 0 Q-6 -15 0 -30 Q6 -15 4 0" fill="#f59e0b" opacity=".8"/></g>' },
  { id: 'book', name: 'Grimoire Ouvert', svg: '<g transform="translate(145, 115)"><path d="M-20 0 L20 0 L20 30 L-20 30 Z" fill="#fef3c7" stroke="#b45309" stroke-width="2"/><path d="M0 0 L0 30" stroke="#b45309" stroke-width="1.5"/><line x1="-15" y1="5" x2="15" y2="5" stroke="#382820" stroke-width="1"/><line x1="-15" y1="12" x2="15" y2="12" stroke="#382820" stroke-width="1"/><line x1="-15" y1="19" x2="15" y2="19" stroke="#382820" stroke-width="1"/></g>' }
];

// ==========================================================================
// AURAS MAGIQUES
// ==========================================================================
const AURAS = [
  { id: 'none', name: 'Aucune', color: 'transparent', svg: '' },
  { id: 'gold', name: 'Dorée (Lumière)', color: '#e4bf70', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#e4bf70" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #e4bf70)"/><circle cx="200" cy="240" r="90" fill="none" stroke="#e4bf70" stroke-width="1.5" opacity=".3" stroke-dasharray="8 4"/>' },
  { id: 'violet', name: 'Violette (Arcane)', color: '#a88cff', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#a88cff" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #a88cff)"/><ellipse cx="200" cy="240" rx="130" ry="70" fill="none" stroke="#a88cff" stroke-width="1.5" opacity=".3" transform="rotate(15 200 240)"/>' },
  { id: 'cyan', name: 'Cyan (Technomancie)', color: '#5cdbe2', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#5cdbe2" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #5cdbe2)"/><rect x="100" y="140" width="200" height="200" fill="none" stroke="#5cdbe2" stroke-width="1.5" opacity=".3" rx="20" transform="rotate(45 200 240)"/>' },
  { id: 'emerald', name: 'Émeraude (Nature)', color: '#65c29a', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#65c29a" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #65c29a)"/><path d="M200 120 Q250 200 200 280 Q150 200 200 120" fill="none" stroke="#65c29a" stroke-width="1.5" opacity=".3"/><path d="M200 120 Q150 200 200 280 Q250 200 200 120" fill="none" stroke="#65c29a" stroke-width="1.5" opacity=".3"/>' },
  { id: 'ember', name: 'Braise (Feu)', color: '#f59e0b', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#f59e0b" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #f59e0b)"/><g fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)"><circle cx="200" cy="150" r="4"/><circle cx="150" cy="200" r="3"/><circle cx="250" cy="200" r="3"/><circle cx="180" cy="280" r="4"/><circle cx="220" cy="280" r="3"/></g>' },
  { id: 'shadow', name: 'Ombre (Néant)', color: '#584068', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#584068" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #584068)"/><ellipse cx="200" cy="240" rx="100" ry="100" fill="none" stroke="#584068" stroke-width="1.5" opacity=".3" stroke-dasharray="6 6"/><circle cx="200" cy="240" r="60" fill="#584068" opacity=".1"/>' },
  { id: 'blood', name: 'Sang (Vitalité)', color: '#b83030', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#b83030" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #b83030)"/><g fill="#b83030"><circle cx="200" cy="160" r="5"/><circle cx="170" cy="220" r="4"/><circle cx="230" cy="220" r="4"/><circle cx="200" cy="280" r="6"/></g>' },
  { id: 'frost', name: 'Givre (Glace)', color: '#70c0e8', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#70c0e8" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #70c0e8)"/><g stroke="#70c0e8" stroke-width="1.5" fill="none" filter="drop-shadow(0 0 4px #70c0e8)"><path d="M200 120 L180 160 L220 160 M200 120 L170 180 L230 180 M200 120 L160 200 L240 200"/></g>' },
  { id: 'storm', name: 'Tempête (Foudre)', color: '#e0d040', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#e0d040" stroke-width="2" opacity=".5" filter="drop-shadow(0 0 12px #e0d040)"/><g stroke="#e0d040" stroke-width="2" fill="none" filter="drop-shadow(0 0 6px #e0d040)"><path d="M200 130 L185 170 L200 160 L190 200 L200 190 L210 230 L200 210 L220 190 L210 160 L200 170 L215 130 Z"/></g>' },
  { id: 'holy', name: 'Sacrée (Divin)', color: '#f8f0d0', svg: '<circle cx="200" cy="240" r="120" fill="none" stroke="#f8f0d0" stroke-width="2" opacity=".6" filter="drop-shadow(0 0 16px #f8f0d0)"/><g stroke="#f8f0d0" stroke-width="1.5" fill="none" opacity=".5"><circle cx="200" cy="240" r="80"/><circle cx="200" cy="240" r="100"/><path d="M200 120 L200 360 M120 240 L280 240"/></g>' }
];

// ==========================================================================
// CADRES DE PORTRAIT
// ==========================================================================
const FRAMES = [
  { id: 'classic', name: 'Classique', svg: '<rect x="10" y="10" width="380" height="460" rx="16" fill="none" stroke="#c9a84c" stroke-width="3"/><rect x="16" y="16" width="368" height="448" rx="12" fill="none" stroke="#c9a84c" stroke-width="1" opacity=".5"/>' },
  { id: 'ornate', name: 'Ciselé', svg: '<rect x="10" y="10" width="380" height="460" rx="16" fill="none" stroke="#c9a84c" stroke-width="3"/><rect x="16" y="16" width="368" height="448" rx="12" fill="none" stroke="#c9a84c" stroke-width="1" opacity=".5"/><g stroke="#c9a84c" stroke-width="2" fill="none"><path d="M10 100 L25 100 M10 380 L25 380 M390 100 L375 100 M390 380 L375 380"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="#c9a84c" stroke-width="2"/><circle cx="350" cy="50" r="12" fill="none" stroke="#c9a84c" stroke-width="2"/><circle cx="50" cy="430" r="12" fill="none" stroke="#c9a84c" stroke-width="2"/><circle cx="350" cy="430" r="12" fill="none" stroke="#c9a84c" stroke-width="2"/>' },
  { id: 'runic', name: 'Runique', svg: '<rect x="10" y="10" width="380" height="460" rx="16" fill="none" stroke="#a88cff" stroke-width="3" filter="drop-shadow(0 0 8px #a88cff)"/><rect x="18" y="18" width="364" height="444" rx="10" fill="none" stroke="#a88cff" stroke-width="1" opacity=".4"/><g stroke="#a88cff" stroke-width="1.5" fill="none" opacity=".6" filter="drop-shadow(0 0 4px #a88cff)"><path d="M30 30 L30 50 M30 30 L50 30 M370 30 L350 30 M370 30 L370 50 M30 450 L30 430 M30 450 L50 450 M370 450 L370 430 M370 450 L350 450"/></g>' },
  { id: 'nature', name: 'Nature', svg: '<rect x="10" y="10" width="380" height="460" rx="20" fill="none" stroke="#65c29a" stroke-width="3"/><rect x="18" y="18" width="364" height="444" rx="14" fill="none" stroke="#65c29a" stroke-width="1" opacity=".4"/><g stroke="#65c29a" stroke-width="2" fill="none" opacity=".7"><path d="M30 100 Q40 90 50 100 Q40 110 30 100 M370 100 Q360 90 350 100 Q360 110 370 100 M30 380 Q40 390 50 380 Q40 370 30 380 M370 380 Q360 390 350 380 Q360 370 370 380"/></g>' },
  { id: 'dark', name: 'Sombre', svg: '<rect x="10" y="10" width="380" height="460" rx="16" fill="none" stroke="#382838" stroke-width="3"/><rect x="16" y="16" width="368" height="448" rx="12" fill="none" stroke="#583858" stroke-width="1" opacity=".5"/><rect x="22" y="22" width="356" height="436" rx="8" fill="none" stroke="#382838" stroke-width="1" opacity=".3"/>' },
  { id: 'minimal', name: 'Minimaliste', svg: '<rect x="20" y="20" width="360" height="440" rx="8" fill="none" stroke="#c9a84c" stroke-width="2" opacity=".7"/>' },
  { id: 'parchment', name: 'Parchemin', svg: '<rect x="10" y="10" width="380" height="460" rx="4" fill="#fdf8f0" stroke="#c9a84c" stroke-width="2" opacity=".3"/><path d="M10 10 Q200 0 390 10 Q400 230 390 470 Q200 480 10 470 Q0 240 10 10" fill="none" stroke="#c9a84c" stroke-width="1.5" opacity=".5"/><g stroke="#b89060" stroke-width=".5" opacity=".3"><line x1="20" y1="40" x2="380" y2="40"/><line x1="20" y1="80" x2="380" y2="80"/><line x1="20" y1="120" x2="380" y2="120"/><line x1="20" y1="160" x2="380" y2="160"/><line x1="20" y1="200" x2="380" y2="200"/><line x1="20" y1="240" x2="380" y2="240"/><line x1="20" y1="280" x2="380" y2="280"/><line x1="20" y1="320" x2="380" y2="320"/><line x1="20" y1="360" x2="380" y2="360"/><line x1="20" y1="400" x2="380" y2="400"/><line x1="20" y1="440" x2="380" y2="440"/></g>' },
  { id: 'metal', name: 'Métal', svg: '<rect x="10" y="10" width="380" height="460" rx="16" fill="url(#metal-grad)" stroke="#888898" stroke-width="3"/><rect x="18" y="18" width="364" height="444" rx="10" fill="none" stroke="#a8a8b8" stroke-width="1" opacity=".5"/><defs><linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#383840"/><stop offset="50%" stop-color="#585868"/><stop offset="100%" stop-color="#383840"/></linearGradient></defs>' }
];

// ==========================================================================
// DÉCORS / ARRIÈRE-PLANS
// ==========================================================================
const BACKDROPS = [
  { id: 'fortress', name: 'Forteresse', desc: 'Murs de pierre, bannières', color: '#e4bf70', svg: '<rect width="400" height="480" fill="#0d1820"/><path d="M0 480 L50 350 L50 200 L100 200 L100 350 L150 350 L150 200 L200 200 L200 350 L250 350 L250 200 L300 200 L300 350 L350 350 L350 200 L400 200 L400 480 Z" fill="#182830"/><circle cx="200" cy="150" r="80" fill="none" stroke="#e4bf70" stroke-width="2" opacity=".2"/><rect x="170" y="350" width="60" height="130" fill="#283038" stroke="#485060" stroke-width="2"/><rect x="185" y="380" width="30" height="60" fill="#181008"/>' },
  { id: 'crypt', name: 'Crypte Runique', desc: 'Pierres anciennes, runes', color: '#a88cff', svg: '<rect width="400" height="480" fill="#100818"/><path d="M0 480 L40 400 L40 280 L100 280 L100 400 L160 400 L160 280 L220 280 L220 400 L280 400 L280 280 L340 280 L340 400 L400 400 L400 480 Z" fill="#181020"/><circle cx="200" cy="200" r="70" fill="none" stroke="#a88cff" stroke-width="2" opacity=".3" stroke-dasharray="8 4"/><path d="M200 130 L200 270 M130 200 L270 200" stroke="#a88cff" stroke-width="1.5" opacity=".4"/><g stroke="#a88cff" stroke-width="1.5" fill="none" opacity=".5"><path d="M150 150 L170 130 M230 130 L250 150 M150 250 L170 270 M230 270 L250 250"/></g>' },
  { id: 'forest', name: 'Forêt Brumeuse', desc: 'Arbres géants, lumière verte', color: '#65c29a', svg: '<rect width="400" height="480" fill="#051508"/><polygon points="50 480 80 200 110 480" fill="#0d2510" opacity=".6"/><polygon points="120 480 160 150 200 480" fill="#0d2510" opacity=".7"/><polygon points="220 480 260 220 300 480" fill="#0d2510" opacity=".5"/><polygon points="320 480 360 180 400 480" fill="#0d2510" opacity=".6"/><ellipse cx="200" cy="350" rx="150" ry="40" fill="#65c29a" opacity=".08"/><g fill="#65c29a" opacity=".15"><circle cx="100" cy="380" r="3"/><circle cx="180" cy="400" r="2"/><circle cx="250" cy="390" r="3"/><circle cx="320" cy="410" r="2"/></g>' },
  { id: 'tavern', name: 'Taverne Chaleureuse', desc: 'Bois, feu, ambiance', color: '#e88030', svg: '<rect width="400" height="480" fill="#1a1008"/><rect x="0" y="380" width="400" height="100" fill="#281808"/><rect x="150" y="280" width="100" height="100" fill="#382008" stroke="#583010" stroke-width="2"/><ellipse cx="200" cy="330" rx="40" ry="30" fill="#e86020" filter="drop-shadow(0 0 20px #e86020)" opacity=".8"/><g stroke="#483010" stroke-width="2"><line x1="160" y1="380" x2="160" y2="280"/><line x1="240" y1="380" x2="240" y2="280"/></g><g fill="#e88030" filter="drop-shadow(0 0 4px #e88030)" opacity=".6"><circle cx="80" cy="350" r="4"/><circle cx="320" cy="340" r="3"/></g>' },
  { id: 'lab', name: 'Laboratoire Mystique', desc: 'Fioles, cercles, magie', color: '#5cdbe2', svg: '<rect width="400" height="480" fill="#051018"/><rect x="50" y="350" width="300" height="100" fill="#0a1828" stroke="#285068" stroke-width="1" rx="8"/><g stroke="#5cdbe2" stroke-width="1.5" fill="none" opacity=".4"><circle cx="200" cy="200" r="80"/><circle cx="200" cy="200" r="110"/><path d="M100 200 L300 200 M200 100 L200 300"/></g><g fill="#5cdbe2" opacity=".6" filter="drop-shadow(0 0 4px #5cdbe2)"><circle cx="120" cy="380" r="6"/><circle cx="140" cy="380" r="5"/><circle cx="160" cy="380" r="4"/><circle cx="240" cy="380" r="4"/><circle cx="260" cy="380" r="5"/><circle cx="280" cy="380" r="6"/></g><rect x="180" y="200" width="40" height="40" fill="none" stroke="#5cdbe2" stroke-width="2" rx="4" transform="rotate(45 200 220)"/>' },
  { id: 'mountain', name: 'Sommet Enneigé', desc: 'Altitude, vent, ciel', color: '#c8d8f0', svg: '<rect width="400" height="480" fill="#e8f0f8"/><polygon points="0 480 150 100 300 480" fill="#d0dce8"/><polygon points="100 480 200 50 300 480" fill="#c0d0e0"/><polygon points="200 480 250 80 350 480" fill="#d0dce8"/><ellipse cx="200" cy="150" rx="180" ry="60" fill="#f8f8ff" opacity=".5"/><g stroke="#a8b8d0" stroke-width="1.5" fill="none"><path d="M150 100 Q180 140 200 120 Q220 140 250 80"/></g>' },
  { id: 'desert', name: 'Désert Doré', desc: 'Dunes, soleil, chaleur', color: '#e4bf70', svg: '<rect width="400" height="480" fill="#2a2010"/><path d="M0 350 Q100 300 200 350 Q300 300 400 350 L400 480 L0 480 Z" fill="#3a2818"/><path d="M0 400 Q100 350 200 400 Q300 350 400 400 L400 480 L0 480 Z" fill="#2a2010"/><circle cx="350" cy="80" r="60" fill="#f5d99e" filter="drop-shadow(0 0 30px #f5d99e)"/><g fill="#e4bf70" opacity=".1"><circle cx="80" cy="400" r="3"/><circle cx="150" cy="420" r="2"/><circle cx="280" cy="410" r="3"/><circle cx="350" cy="430" r="2"/></g>' },
  { id: 'void', name: 'Néant Astral', desc: 'Étoiles, vide, mystère', color: '#584068', svg: '<rect width="400" height="480" fill="#050208"/><g fill="#fff" opacity=".6"><circle cx="50" cy="50" r="1"/><circle cx="150" cy="80" r="1.5"/><circle cx="300" cy="60" r="1"/><circle cx="80" cy="200" r="1"/><circle cx="250" cy="180" r="1.5"/><circle cx="350" cy="220" r="1"/><circle cx="100" cy="350" r="1"/><circle cx="300" cy="380" r="1.5"/></g><ellipse cx="200" cy="240" rx="200" ry="150" fill="none" stroke="#584068" stroke-width="1.5" opacity=".2" stroke-dasharray="10 10"/><circle cx="200" cy="240" r="80" fill="#584068" opacity=".05"/>' },
  { id: 'library', name: 'Bibliothèque Ancienne', desc: 'Livres, savoir, poussière', color: '#b89058', svg: '<rect width="400" height="480" fill="#151008"/><g fill="#282010" stroke="#483820" stroke-width="1"><rect x="20" y="100" width="80" height="350" rx="4"/><rect x="120" y="100" width="80" height="350" rx="4"/><rect x="220" y="100" width="80" height="350" rx="4"/><rect x="320" y="100" width="60" height="350" rx="4"/></g><g fill="#e4bf70" opacity=".15"><rect x="30" y="120" width="10" height="40" rx="2"/><rect x="50" y="120" width="8" height="40" rx="2"/><rect x="70" y="120" width="12" height="40" rx="2"/><rect x="130" y="120" width="10" height="40" rx="2"/><rect x="150" y="120" width="8" height="40" rx="2"/></g><ellipse cx="200" cy="460" rx="180" ry="30" fill="#e4bf70" opacity=".08"/>' },
  { id: 'battlefield', name: 'Champ de Bataille', desc: 'Cendres, épées, gloire', color: '#b03030', svg: '<rect width="400" height="480" fill="#1a0a0a"/><path d="M0 300 Q100 280 200 300 Q300 280 400 300 L400 480 L0 480 Z" fill="#2a1010"/><g stroke="#402020" stroke-width="2" fill="none"><line x1="80" y1="300" x2="70" y2="200"/><line x1="150" y1="300" x2="145" y2="220"/><line x1="250" y1="300" x2="260" y2="210"/><line x1="320" y1="300" x2="330" y2="190"/></g><g fill="#b03030" filter="drop-shadow(0 0 4px #b03030)" opacity=".4"><circle cx="180" cy="280" r="3"/><circle cx="220" cy="280" r="3"/></g>' }
];

// ==========================================================================
// ÉCLAIRAGES D'AMBIANCE
// ==========================================================================
const LIGHTINGS = [
  { id: 'natural', name: 'Naturel', desc: 'Lumière du jour', filter: '' },
  { id: 'golden-hour', name: 'Heure Dorée', desc: 'Chaud, doux', filter: 'sepia(.3) saturate(1.2) hue-rotate(-10deg)' },
  { id: 'blue-hour', name: 'Heure Bleue', desc: 'Froid, mystérieux', filter: 'hue-rotate(220deg) saturate(1.3) brightness(.9)' },
  { id: 'candlelight', name: 'Chandelle', desc: 'Intime, vacillant', filter: 'sepia(.5) saturate(1.4) brightness(.8)' },
  { id: 'moonlight', name: 'Clair de Lune', desc: 'Argenté, surnaturel', filter: 'grayscale(.3) hue-rotate(180deg) brightness(.7) contrast(1.2)' },
  { id: 'firelight', name: 'Lumière du Feu', desc: 'Dramatique, chaud', filter: 'sepia(.4) saturate(1.5) hue-rotate(-20deg) brightness(.9)' },
  { id: 'magic', name: 'Magique', desc: 'Coloré, surnaturel', filter: 'hue-rotate(280deg) saturate(1.6) brightness(1.1)' },
  { id: 'dark', name: 'Sombre', desc: 'Contraste élevé', filter: 'brightness(.6) contrast(1.4)' },
  { id: 'high-contrast', name: 'Contraste Extrême', desc: 'Lisibilité max', filter: 'contrast(2) brightness(1.2)' }
];

// ==========================================================================
// PARTICULES D'AMBIANCE
// ==========================================================================
const PARTICLES = [
  { id: 'none', name: 'Aucune', svg: '' },
  { id: 'sparkles', name: 'Étincelles Dorées', svg: '<g fill="#f5d99e" filter="drop-shadow(0 0 4px #f5d99e)"><circle cx="80" cy="100" r="2"/><circle cx="320" cy="120" r="1.5"/><circle cx="100" cy="350" r="2"/><circle cx="300" cy="380" r="1.5"/></g>' },
  { id: 'magic-sparkles', name: 'Étincelles Magiques', svg: '<g filter="drop-shadow(0 0 4px #a88cff)"><circle cx="80" cy="100" r="2" fill="#c8b8ff"/><circle cx="320" cy="120" r="1.5" fill="#a88cff"/><circle cx="100" cy="350" r="2" fill="#e8d8ff"/><circle cx="300" cy="380" r="1.5" fill="#c8b8ff"/></g>' },
  { id: 'embers', name: 'Braises', svg: '<g fill="#e86020" filter="drop-shadow(0 0 4px #e86020)"><circle cx="80" cy="100" r="2"/><circle cx="320" cy="120" r="1.5"/><circle cx="100" cy="350" r="2"/><circle cx="300" cy="380" r="1.5"/></g>' },
  { id: 'leaves', name: 'Feuilles', svg: '<g fill="#65c29a"><ellipse cx="80" cy="100" rx="3" ry="2" transform="rotate(-30 80 100)"/><ellipse cx="320" cy="120" rx="2.5" ry="1.5" transform="rotate(15 320 120)"/><ellipse cx="100" cy="350" rx="3" ry="2" transform="rotate(45 100 350)"/><ellipse cx="300" cy="380" rx="2.5" ry="1.5" transform="rotate(-20 300 380)"/></g>' },
  { id: 'snow', name: 'Neige', svg: '<g fill="#f8f8ff"><circle cx="80" cy="100" r="2"/><circle cx="320" cy="120" r="1.5"/><circle cx="100" cy="350" r="2"/><circle cx="300" cy="380" r="1.5"/><circle cx="150" cy="200" r="1"/><circle cx="250" cy="220" r="1"/></g>' },
  { id: 'dust', name: 'Poussière / Motes', svg: '<g fill="#e4bf70" opacity=".5"><circle cx="80" cy="100" r="1.5"/><circle cx="320" cy="120" r="1"/><circle cx="100" cy="350" r="1.5"/><circle cx="300" cy="380" r="1"/><circle cx="150" cy="200" r=".8"/><circle cx="250" cy="220" r=".8"/><circle cx="200" cy="150" r="1"/><circle cx="200" cy="300" r=".8"/></g>' },
  { id: 'bubbles', name: 'Bulles', svg: '<g fill="none" stroke="#5cdbe2" stroke-width="1.5" opacity=".6" filter="drop-shadow(0 0 3px #5cdbe2)"><circle cx="80" cy="100" r="6"/><circle cx="320" cy="120" r="4"/><circle cx="100" cy="350" r="5"/><circle cx="300" cy="380" r="4"/></g>' },
  { id: 'runes', name: 'Runes Flottantes', svg: '<g stroke="#e4bf70" stroke-width="1.5" fill="none" filter="drop-shadow(0 0 3px #e4bf70)"><path d="M80 100 L70 80 M80 100 L90 80"/><path d="M320 120 L310 100 M320 120 L330 100"/><path d="M100 350 L90 330 M100 350 L110 330"/><path d="M300 380 L290 360 M300 380 L310 360"/></g>' },
  { id: 'feathers', name: 'Plumes', svg: '<g fill="#e4bf70" opacity=".8"><path d="M80 100 Q75 90 70 100 Q65 90 60 100"/><path d="M320 120 Q315 110 310 120 Q305 110 300 120"/><path d="M100 350 Q95 340 90 350 Q85 340 80 350"/></g>' }
];

// ==========================================================================
// CLASSES
// ==========================================================================
const CLASSES = {
  paladin: {
    id: 'paladin', name: 'Paladin', role: 'Le Bâtisseur', spec: 'Cadrage & Livrables',
    icon: 'i-shield', color: '#e4bf70', glow: 'rgba(228,191,112,.4)',
    defaultStats: { social: 3, speed: 4, channel: 2, chaos: 2 },
    armorName: 'Armure de Plates Dorée',
    bodyType: 'human', build: 'athletic', height: 'average',
    outfitPreset: 'plate-gold'
  },
  ranger: {
    id: 'ranger', name: 'Rôdeur', role: 'L\'Éclaireur', spec: 'Défrichage Solo & Tech',
    icon: 'i-compass', color: '#4dc397', glow: 'rgba(77,195,151,.4)',
    defaultStats: { social: 2, speed: 3, channel: 1, chaos: 4 },
    armorName: 'Cape & Harnais de Cuir',
    bodyType: 'elf', build: 'slender', height: 'tall',
    outfitPreset: 'leather-green'
  },
  bard: {
    id: 'bard', name: 'Barde', role: 'L\'Idéateur', spec: 'Pitch & Créativité',
    icon: 'i-mask', color: '#b389ff', glow: 'rgba(179,137,255,.4)',
    defaultStats: { social: 5, speed: 5, channel: 4, chaos: 5 },
    armorName: 'Doublet de Velours Brodé',
    bodyType: 'human', build: 'average', height: 'average',
    outfitPreset: 'velvet-red'
  },
  alchemist: {
    id: 'alchemist', name: 'Alchimiste', role: 'Le Finisseur', spec: 'Rigueur UX & Débug',
    icon: 'i-flask', color: '#5ccde2', glow: 'rgba(92,205,226,.4)',
    defaultStats: { social: 2, speed: 2, channel: 3, chaos: 1 },
    armorName: 'Tablier Cuir & Fioles',
    bodyType: 'human', build: 'average', height: 'average',
    outfitPreset: 'apron-leather'
  }
};

// ==========================================================================
// STATS — Textes descriptifs par niveau
// ==========================================================================
const STAT_TEXTS = {
  social: [
    '', // index 0 unused
    'Ermite en crypte : focus solo complet, n\'aime pas être dérangé à l\'improviste.',
    'Focus calme : préfère des points de synchro ponctuels et espacés.',
    'Équilibré : travail silencieux le matin, synchronisation d\'équipe l\'après-midi.',
    'Coopératif actif : aime penser à voix haute et travailler en binôme régulier.',
    'Énergie de taverne : besoin vital de brainstorm oral et de calls ouverts.'
  ],
  speed: [
    '',
    'Réflexion profonde : a besoin de 24h d\'assimilation avant d\'écrire une ligne.',
    'Analyse posée : pose la structure et le plan avant d\'attaquer.',
    'Rythme modéré : prépare les bases puis exécute méthodiquement.',
    'Démarrage rapide : après un court cadrage de 10 min, commence à produire.',
    'Ruée héroïque : prêt à foncer et tester dans la minute, apprend en marchant.'
  ],
  channel: [
    '',
    '100% Écrit : tout par tickets Notion/Slack, aucun call surprise.',
    'Écrit prioritaire : écrit pour le quotidien, vocal uniquement si blocage critique.',
    'Mixte équilibré : écrit pour les tâches, vocal rapide de 3 min pour débloquer.',
    'Oral direct : préfère appeler 2 minutes plutôt qu\'écrire un roman de messages.',
    'Vocal continu : toujours dans la salle vocale pour échanger en live.'
  ],
  chaos: [
    '',
    'Mur de pierre : le plan fixé doit rester figé, tout changement soudain est anxiogène.',
    'Besoin de stabilité : les décisions doivent rester fermes au moins sur la journée.',
    'Pragmatique : sait s\'adapter si la charge reste réaliste.',
    'Agile aventureux : aime réajuster si une meilleure idée émerge en cours de route.',
    'Maître des tempêtes : s\'épanouit dans l\'improvisation et la pression de dernière minute.'
  ]
};

// ==========================================================================
// SNIPPETS POUR GRIMOIRE (Suggestions rapides)
// ==========================================================================
const GRIMOIRE_SNIPPETS = {
  ultimate: [
    { text: 'Structure les sprints et découpe les tâches en jalons limpides.', label: 'Cadrage Agile' },
    { text: 'Débuggage calme & persévérance sous pression.', label: 'Débug Zen' },
    { text: 'Synthèse rapide des débats confus en 3 actions nettes.', label: 'Synthèse Éclair' },
    { text: 'Veille technologique & vulgarisation d\'outils obscurs.', label: 'Veille Technique' },
    { text: 'Médiation d\'équipe & résolution de conflits.', label: 'Médiateur' },
    { text: 'Créativité foisonnante & idées hors des sentiers battus.', label: 'Idéation Pure' },
    { text: 'Architecture propre & dette technique maîtrisée.', label: 'Architecte Propre' },
    { text: 'Automatisation des tâches répétitives & CI/CD fluide.', label: 'Automatiseur' }
  ],
  weakness: [
    { text: 'Le silence radio de plus de 12h sans donner de nouvelles.', label: 'Silence Radio' },
    { text: 'Les débats de 2 heures sans ordre du jour ni décisions.', label: 'Réunions Fleuves' },
    { text: 'Les changements d\'objectifs improvisés la veille d\'un jalon.', label: 'Pivots de Nuit' },
    { text: 'Être interrompu toutes les 15 minutes en plein focus.', label: 'Ping Incessant' },
    { text: 'Code poussé sans tests ni review.', label: 'Yolo Push' },
    { text: 'Documentation absente ou obsolète.', label: 'Doc Fantôme' },
    { text: 'Micro-management & manque de confiance.', label: 'Micro-Manager' },
    { text: 'Critiques vagues sans propositions concrètes.', label: 'Feedback Flou' }
  ],
  potion: [
    { text: 'Par message direct avec les 2 actions concrètes attendues.', label: 'Écrit Structuré' },
    { text: 'Dis-le-moi directement en tête-à-tête autour d\'un café calme.', label: 'Point Café' },
    { text: 'Laisse-moi 30 minutes pour digérer avant d\'en rediscuter à froid.', label: '30 Min Digestion' },
    { text: 'Aide-moi à redécouper ma tâche en sous-objectifs simples.', label: 'Redécoupage' },
    { text: 'Valide ma compréhension avant que je ne commence.', label: 'Check Compréhension' },
    { text: 'Fais-moi un retour précis sur ce qui bloque, pas une critique vague.', label: 'Feedback Concret' },
    { text: 'Propose-moi 3 options et laisse-moi choisir.', label: 'Choix Guidé' },
    { text: 'Réserve-moi un créneau focus sans interruption.', label: 'Créneau Focus' }
  ]
};

// ==========================================================================
// ROSTER PAR DÉFAUT (Hall de Guilde pré-rempli)
// ==========================================================================
const DEFAULT_GUILD_ROSTER = [
  {
    id: 'hero-001', name: 'Damoiselle Camille', guild: 'Équipe 1 • Datacrons',
    classKey: 'ranger', title: 'L\'Éclaireuse des API',
    stats: { social: 2, speed: 3, channel: 1, chaos: 4 },
    ultimate: 'Épluche la documentation technique et trouve la solution en solo.',
    weakness: 'Les réunions de 2 heures sans ordre du jour précis.',
    potion: 'Écris-moi sur Slack avec le lien du bug et laisse-moi 30 min.',
    appearance: { race: 'elf', skin: 'moon', build: 'slender', height: 'tall', posture: 'ready',
      face: 'oval', eyes: 'green', expression: 'determined', mark: 'freckles', facialHair: 'none', warpaint: 'none',
      hairStyle: 'braids', hairColor: 'red', hairHighlight: 'golden',
      outfit: 'leather-green', headgear: 'hood-up', artifact: 'dagger', aura: 'emerald', frame: 'nature',
      backdrop: 'forest', lighting: 'natural', particles: 'leaves' }
  },
  {
    id: 'hero-002', name: 'Mage Sofiane', guild: 'Équipe 2 • WebSpells',
    classKey: 'bard', title: 'L\'Orateur Inspiré',
    stats: { social: 5, speed: 5, channel: 4, chaos: 5 },
    ultimate: 'Structure des slides percutantes et donne l\'envie d\'avancer.',
    weakness: 'Le manque d\'enthousiasme et les silences gênants en réu.',
    potion: 'Prends un café avec moi pour rebondir sur une idée à la fois.',
    appearance: { race: 'human', skin: 'olive', build: 'average', height: 'average', posture: 'swagger',
      face: 'heart', eyes: 'hazel', expression: 'smirk', mark: 'goatee', facialHair: 'goatee', warpaint: 'none',
      hairStyle: 'curly-short', hairColor: 'black', hairHighlight: 'silver',
      outfit: 'velvet-blue', headgear: 'circlet', artifact: 'lute', aura: 'violet', frame: 'ornate',
      backdrop: 'tavern', lighting: 'candlelight', particles: 'sparkles' }
  },
  {
    id: 'hero-003', name: 'Docteur Yuna', guild: 'Équipe 3 • Algomanciens',
    classKey: 'alchemist', title: 'L\'Horlogère du Pixel',
    stats: { social: 2, speed: 2, channel: 3, chaos: 1 },
    ultimate: 'Traque les alignements foireux et rend le produit ultra pro.',
    weakness: 'Pousser du code à minuit sans tester sur mobile.',
    potion: 'Rappelle-moi la contrainte de temps pour qu\'on coupe dans les détails.',
    appearance: { race: 'human', skin: 'peach', build: 'average', height: 'short', posture: 'straight',
      face: 'oval', eyes: 'blue', expression: 'stern', mark: 'rune-forehead', facialHair: 'none', warpaint: 'geometric',
      hairStyle: 'topknot', hairColor: 'silver', hairHighlight: 'blue',
      outfit: 'robe-alchemist', headgear: 'glasses', artifact: 'potion', aura: 'cyan', frame: 'runic',
      backdrop: 'lab', lighting: 'magic', particles: 'bubbles' }
  },
  {
    id: 'hero-004', name: 'Sire Valérian', guild: 'Projet Fil Rouge #03',
    classKey: 'paladin', title: 'Le Bâtisseur Méthodique',
    stats: { social: 3, speed: 4, channel: 2, chaos: 2 },
    ultimate: 'Structure les sprints et découpe les tâches en jalons limpides.',
    weakness: 'Le silence de plus de 12h & les changements d\'objectifs la veille du jalon.',
    potion: 'Par message direct avec les 2 actions concrètes attendues.',
    appearance: { race: 'human', skin: 'peach', build: 'athletic', height: 'average', posture: 'straight',
      face: 'square', eyes: 'amber', expression: 'determined', mark: 'scar-eye', facialHair: 'stubble', warpaint: 'none',
      hairStyle: 'crew', hairColor: 'darkbrown', hairHighlight: 'none',
      outfit: 'plate-gold', headgear: 'none', artifact: 'scroll', aura: 'gold', frame: 'classic',
      backdrop: 'fortress', lighting: 'golden-hour', particles: 'sparkles' }
  }
];

// Export global
window.GAME_DATA = {
  RACES, SKIN_TONES, BUILDS, HEIGHTS, POSTURES,
  FACE_SHAPES, EYE_SHAPES, EYE_COLORS, EXPRESSIONS,
  MARKS, FACIAL_HAIR, WARPAINTS,
  HAIRSTYLES, HAIR_COLORS, HAIR_HIGHLIGHTS,
  OUTFITS, HEADGEAR, ARTIFACTS, AURAS, FRAMES,
  BACKDROPS, LIGHTINGS, PARTICLES,
  CLASSES, STAT_TEXTS, GRIMOIRE_SNIPPETS, DEFAULT_GUILD_ROSTER
};