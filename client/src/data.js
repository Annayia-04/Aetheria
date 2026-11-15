// Shared Game Data for Aetheria (used by both client and server)
export const GAME_DATA = {
  // Races
  RACES: [
    { id: 'human', name: 'Humain', desc: 'Équilibré, adaptable', baseBody: 'human', skinTones: ['pale', 'peach', 'olive', 'bronze', 'brown', 'dark'] },
    { id: 'elf', name: 'Elfe', desc: 'Grâce, longévité, magie', baseBody: 'elf', ears: 'pointed', skinTones: ['pale', 'moon', 'ash', 'bronze', 'obsidian'] },
    { id: 'dwarf', name: 'Nain', desc: 'Robuste, artisan, résistant', baseBody: 'dwarf', build: 'stocky', skinTones: ['pale', 'ruddy', 'bronze', 'earth', 'stone'] },
    { id: 'orc', name: 'Orque', desc: 'Puissant, imposant, fier', baseBody: 'orc', build: 'muscular', skinTones: ['green', 'olive', 'bronze', 'grey', 'obsidian'] },
    { id: 'tiefling', name: 'Tieffelin', desc: 'Héritage infernal, charisme', baseBody: 'human', horns: true, skinTones: ['red', 'violet', 'blue', 'ash', 'pale'] },
    { id: 'halfling', name: 'Halfelin', desc: 'Petit, chanceux, discret', baseBody: 'halfling', height: 'short', skinTones: ['pale', 'peach', 'olive', 'bronze', 'brown'] }
  ],

  // Skin Tones
  SKIN_TONES: {
    pale: { name: 'Porcelaine', base: '#f5e6d3', shadow: '#d4c4b0', lip: '#e8b4b4', freckle: '#c9a690' },
    peach: { name: 'Pêche', base: '#fad6b8', shadow: '#e8b890', lip: '#e8a8a8', freckle: '#d49678' },
    olive: { name: 'Olive', base: '#d4c4a8', shadow: '#b8a088', lip: '#c8a0a0', freckle: '#a09078' },
    bronze: { name: 'Bronze', base: '#c49a6c', shadow: '#a07850', lip: '#b88888', freckle: '#8c7058' },
    brown: { name: 'Ambre', base: '#a07850', shadow: '#785838', lip: '#a87878', freckle: '#685038' },
    dark: { name: 'Ébène', base: '#684838', shadow: '#483028', lip: '#886060', freckle: '#584030' },
    moon: { name: 'Clair de Lune', base: '#e8e8f0', shadow: '#c8c8d8', lip: '#d8c8e8', freckle: '#b8b8d0' },
    ash: { name: 'Cendre', base: '#a8a8b8', shadow: '#888898', lip: '#b8a8c8', freckle: '#787890' },
    obsidian: { name: 'Obsidienne', base: '#282030', shadow: '#181018', lip: '#584060', freckle: '#382840' },
    ruddy: { name: 'Rougeaud', base: '#e8a890', shadow: '#c88870', lip: '#d88080', freckle: '#b07060' },
    earth: { name: 'Terre Cuite', base: '#c88860', shadow: '#a06848', lip: '#b87878', freckle: '#905840' },
    stone: { name: 'Pierre', base: '#989890', shadow: '#787870', lip: '#a8a0a0', freckle: '#686860' },
    green: { name: 'Vert Mousse', base: '#6c8c5c', shadow: '#4c6c3c', lip: '#5c7c4c', freckle: '#3c5c2c' },
    red: { name: 'Rouge Braise', base: '#c85840', shadow: '#a04030', lip: '#b84848', freckle: '#903830' },
    violet: { name: 'Violet Nuit', base: '#785898', shadow: '#583878', lip: '#9878b8', freckle: '#482868' },
    blue: { name: 'Bleu Glace', base: '#5888b8', shadow: '#386898', lip: '#78a8d8', freckle: '#285888' }
  },

  // Builds
  BUILDS: [
    { id: 'slender', name: 'Élancé', desc: 'Fin, agile', bodyScale: { width: .9, torso: .95, limbs: 1.05 } },
    { id: 'average', name: 'Moyen', desc: 'Équilibré', bodyScale: { width: 1, torso: 1, limbs: 1 } },
    { id: 'athletic', name: 'Athlétique', desc: 'Musclé, tonique', bodyScale: { width: 1.05, torso: 1.05, limbs: 1 } },
    { id: 'stocky', name: 'Trapu', desc: 'Large, costaud', bodyScale: { width: 1.15, torso: 1.1, limbs: .95 } },
    { id: 'muscular', name: 'Massif', desc: 'Imposant, puissant', bodyScale: { width: 1.2, torso: 1.15, limbs: 1.05 } },
    { id: 'soft', name: 'Rondouillet', desc: 'Doux, confortable', bodyScale: { width: 1.1, torso: 1.08, limbs: .98 } }
  ],

  // Heights
  HEIGHTS: [
    { id: 'short', name: 'Petit', desc: 'Compact', scale: .92, cameraY: 1.08 },
    { id: 'average', name: 'Standard', desc: 'Moyen', scale: 1, cameraY: 1 },
    { id: 'tall', name: 'Grand', desc: 'Élevé', scale: 1.08, cameraY: .94 },
    { id: 'towering', name: 'Très Grand', desc: 'Imposant', scale: 1.15, cameraY: .88 }
  ],

  // Postures
  POSTURES: [
    { id: 'straight', name: 'Droit', desc: 'Fier, confiant', spine: 0, shoulders: 0, head: 0 },
    { id: 'relaxed', name: 'Relâché', desc: 'Décontracté', spine: 3, shoulders: -2, head: 1 },
    { id: 'hunched', name: 'Voûté', desc: 'Protecteur, fatigué', spine: -8, shoulders: -6, head: -4 },
    { id: 'ready', name: 'Sur le qui-vive', desc: 'Prêt à bondir', spine: -2, shoulders: 2, head: 0 },
    { id: 'swagger', name: 'Assuré', desc: 'Nonchalant, cool', spine: 5, shoulders: -4, head: 2 }
  ],

  // Face Shapes
  FACE_SHAPES: [
    { id: 'oval', name: 'Ovale', desc: 'Classique, harmonieux', jaw: 0, cheek: 0, chin: 0 },
    { id: 'round', name: 'Rond', desc: 'Doux, juvénile', jaw: -15, cheek: 10, chin: -5 },
    { id: 'square', name: 'Carré', desc: 'Fort, déterminé', jaw: 12, cheek: -5, chin: 8 },
    { id: 'heart', name: 'Cœur', desc: 'Fin, expressif', jaw: -10, cheek: 5, chin: -8 },
    { id: 'diamond', name: 'Diamant', desc: 'Angulaire, aigu', jaw: 5, cheek: 12, chin: 10 },
    { id: 'long', name: 'Allongé', desc: 'Noble, sérieux', jaw: 5, cheek: -5, chin: 12 },
    { id: 'angular', name: 'Anguleux', desc: 'Tranchant, dur', jaw: 15, cheek: -8, chin: 12 }
  ],

  // Eye Colors
  EYE_COLORS: {
    amber: { name: 'Ambré', iris: '#c89030', sclera: '#fff8e8', glow: '#e8b040' },
    brown: { name: 'Marron', iris: '#5c3820', sclera: '#fff8f0', glow: '#8c5830' },
    hazel: { name: 'Noisette', iris: '#7c8c40', sclera: '#fff8e8', glow: '#9cac50' },
    green: { name: 'Vert', iris: '#3c7c4c', sclera: '#f0fff0', glow: '#50b060' },
    blue: { name: 'Bleu', iris: '#3868b8', sclera: '#f0f8ff', glow: '#5090e8' },
    gray: { name: 'Gris', iris: '#787888', sclera: '#f8f8f8', glow: '#9898a8' },
    violet: { name: 'Violet', iris: '#8858b8', sclera: '#f8f0ff', glow: '#a878d8' },
    red: { name: 'Rouge', iris: '#b83840', sclera: '#fff0f0', glow: '#d85058' },
    gold: { name: 'Or', iris: '#d8b020', sclera: '#fffdf0', glow: '#f0d030' },
    heterochromia: { name: 'Hétérochromie', iris: '#3868b8', iris2: '#c89030', sclera: '#fff8f0', glow: '#e8c050' },
    black: { name: 'Noir', iris: '#181818', sclera: '#f0f0f0', glow: '#383838' },
    white: { name: 'Blanc (aveugle)', iris: '#f0f0f0', sclera: '#f0f0f0', glow: '#e0e0e0' }
  },

  // Expressions
  EXPRESSIONS: [
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
  ],

  // Marks
  MARKS: [
    { id: 'none', name: 'Aucune' },
    { id: 'scar-eye', name: 'Cicatrice Œil', desc: 'Traverse le sourcil' },
    { id: 'scar-cheek', name: 'Cicatrice Joue', desc: 'Sur la pommette' },
    { id: 'scar-lip', name: 'Cicatrice Lèvre', desc: 'Coin de la bouche' },
    { id: 'rune-forehead', name: 'Rune Front', desc: 'Symbole magique' },
    { id: 'rune-cheek', name: 'Rune Joue', desc: 'Marque tribale' },
    { id: 'freckles', name: 'Rousseurs', desc: 'Naturelles, solaires' },
    { id: 'moles', name: 'Grains de beauté', desc: 'Quelques marques' },
    { id: 'tattoo-face', name: 'Tatouage Visage', desc: 'Lignes rituelles' },
    { id: 'vitiligo', name: 'Vitiligo', desc: 'Taches dépigmentées' },
    { id: 'warpaint', name: 'Peinture de Guerre', desc: 'Lignes rituelles colorées' }
  ],

  // Facial Hair
  FACIAL_HAIR: [
    { id: 'none', name: 'Rasé de près' },
    { id: 'stubble', name: 'Barbe de 3 jours', desc: 'Léger duvet' },
    { id: 'goatee', name: 'Bouc', desc: 'Menton seulement' },
    { id: 'beard-short', name: 'Barbe Courte', desc: 'Bien taillée' },
    { id: 'beard-full', name: 'Barbe Fournie', desc: 'Longue, épaisse' },
    { id: 'beard-braided', name: 'Barbe Tressée', desc: 'Style nain/guerrier' },
    { id: 'mustache', name: 'Moustache', desc: 'Seule' },
    { id: 'mustache-handlebar', name: 'Moustache Guidon', desc: 'Pointes relevées' },
    { id: 'sideburns', name: 'Favoris', desc: 'Longs sur les joues' }
  ],

  // Warpaints
  WARPAINTS: [
    { id: 'none', name: 'Aucun' },
    { id: 'tribal-lines', name: 'Lignes Tribales', desc: 'Traits sur les joues' },
    { id: 'eye-mask', name: 'Masque Yeux', desc: 'Autour des yeux' },
    { id: 'forehead-mark', name: 'Marque Front', desc: 'Symbole central' },
    { id: 'full-face', name: 'Visage Complet', desc: 'Peinture guerrière' },
    { id: 'clown', name: 'Arlequin', desc: 'Ludique, théâtral' },
    { id: 'geometric', name: 'Géométrique', desc: 'Lignes pures' },
    { id: 'glitter', name: 'Paillettes', desc: 'Féérique, brillant' }
  ],

  // Hairstyles
  HAIRSTYLES: [
    { id: 'bald', name: 'Chauve / Rasé', desc: 'Aucun cheveu' },
    { id: 'buzz', name: 'Coupe Militaire', desc: 'Très court, uniforme' },
    { id: 'crew', name: 'Coupe Court', desc: 'Classique, net' },
    { id: 'textured-crop', name: 'Crop Texturé', desc: 'Court, désordonné' },
    { id: 'side-part', name: 'Râteau Côté', desc: 'Classique, élégant' },
    { id: 'pompadour', name: 'Pompadour', desc: 'Volume sur le devant' },
    { id: 'quiff', name: 'Houppe / Quiff', desc: 'Moderne, stylé' },
    { id: 'messy-short', name: 'Court Ébouriffé', desc: 'Naturel, décontracté' },
    { id: 'curly-short', name: 'Boucles Courtes', desc: 'Naturelles, volumineuses' },
    { id: 'afro-short', name: 'Afro Court', desc: 'Naturel, dense' },
    { id: 'medium-messy', name: 'Mi-Long Ébouriffé', desc: 'Décontracté, rock' },
    { id: 'shoulder-length', name: 'Longueur Épaules', desc: 'Polyvalent' },
    { id: 'long-straight', name: 'Long Lisse', desc: 'Élégant, fluide' },
    { id: 'long-wavy', name: 'Long Ondulé', desc: 'Naturel, mouvement' },
    { id: 'long-curly', name: 'Long Bouclé', desc: 'Volumineux, sauvage' },
    { id: 'braids', name: 'Tresses', desc: 'Style protecteur' },
    { id: 'dreads', name: 'Dreadlocks', desc: 'Naturel, spirituel' },
    { id: 'topknot', name: 'Chignon Haut', desc: 'Samouraï, pratique' },
    { id: 'half-up', name: 'Demi-Queue', desc: 'Polyvalent' },
    { id: 'ponytail-high', name: 'Queue de Cheval Haute', desc: 'Sportive, énergique' },
    { id: 'ponytail-low', name: 'Queue de Cheval Basse', desc: 'Décontractée' },
    { id: 'bun', name: 'Chignon Bas', desc: 'Élégant, formel' },
    { id: 'mohawk', name: 'Mohawk / Iroquois', desc: 'Rebelle, punk' },
    { id: 'faux-hawk', name: 'Faux Hawk', desc: 'Moderne, stylé' },
    { id: 'wolf-cut', name: 'Wolf Cut', desc: 'Tendance, dégradé' },
    { id: 'shag', name: 'Shag / Dégradé', desc: 'Rock, années 70' },
    { id: 'asymmetrical', name: 'Asymétrique', desc: 'Avant-gardiste' }
  ],

  // Hair Colors
  HAIR_COLORS: {
    black: { name: 'Noir Corbeau', base: '#1a1a2e', highlight: '#2a2a4a', tone: 'cool' },
    darkbrown: { name: 'Brun Très Foncé', base: '#2d1b15', highlight: '#4a2c1f', tone: 'warm' },
    brown: { name: 'Brun Sombre', base: '#3d2818', highlight: '#5d3a24', tone: 'warm' },
    chestnut: { name: 'Châtain', base: '#5d3a24', highlight: '#8b5a3a', tone: 'warm' },
    lightbrown: { name: 'Brun Clair', base: '#7a5230', highlight: '#a87048', tone: 'warm' },
    auburn: { name: 'Auburn / Roux Brun', base: '#7a3018', highlight: '#b84820', tone: 'warm' },
    red: { name: 'Roux Flamboyant', base: '#b83018', highlight: '#e85028', tone: 'warm' },
    copper: { name: 'Cuivré', base: '#b85820', highlight: '#e88038', tone: 'warm' },
    strawberry: { name: 'Blond Fraise', base: '#d88060', highlight: '#f8b090', tone: 'warm' },
    darkblonde: { name: 'Blond Foncé', base: '#b89048', highlight: '#d8b068', tone: 'warm' },
    blonde: { name: 'Blond', base: '#d8b058', highlight: '#f8d880', tone: 'warm' },
    platinum: { name: 'Blond Platine', base: '#f0e8d0', highlight: '#fff8e8', tone: 'cool' },
    white: { name: 'Blanc Pur', base: '#f8f8f0', highlight: '#ffffff', tone: 'cool' },
    silver: { name: 'Argenté', base: '#c8c8d0', highlight: '#f0f0f8', tone: 'cool' },
    blueblack: { name: 'Bleu-Noir', base: '#181830', highlight: '#282850', tone: 'cool' },
    blue: { name: 'Bleu Mystique', base: '#183860', highlight: '#3868a0', tone: 'cool' },
    teal: { name: 'Sarcelle', base: '#186060', highlight: '#38a0a0', tone: 'cool' },
    green: { name: 'Vert Nature', base: '#205030', highlight: '#409050', tone: 'cool' },
    purple: { name: 'Violet Rêve', base: '#402050', highlight: '#704090', tone: 'cool' },
    pink: { name: 'Rose Pastel', base: '#b86080', highlight: '#e890b0', tone: 'warm' },
    pastelblue: { name: 'Bleu Pastel', base: '#70a0d0', highlight: '#a0c8f0', tone: 'cool' },
    pastelpurple: { name: 'Violet Pastel', base: '#b080d0', highlight: '#d0b0f0', tone: 'cool' },
    pastelpink: { name: 'Rose Pastel', base: '#e090b0', highlight: '#f0c0d8', tone: 'warm' },
    pastelgreen: { name: 'Vert Pastel', base: '#80c090', highlight: '#b0f0c8', tone: 'cool' },
    ombre_fire: { name: 'Ombre Feu', base: '#3d1810', highlight: '#e84018', tone: 'warm', gradient: true },
    ombre_ocean: { name: 'Ombre Océan', base: '#102840', highlight: '#2080c0', tone: 'cool', gradient: true },
    ombre_forest: { name: 'Ombre Forêt', base: '#183018', highlight: '#40a040', tone: 'cool', gradient: true },
    ombre_sunset: { name: 'Ombre Coucher', base: '#402010', highlight: '#f08030', tone: 'warm', gradient: true },
    rainbow: { name: 'Arc-en-ciel', base: '#ff0080', highlight: '#00ffff', tone: 'warm', gradient: 'rainbow' }
  },

  // Hair Highlights
  HAIR_HIGHLIGHTS: [
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
  ],

  // Outfits per class
  OUTFITS: {
    paladin: [
      { id: 'plate-gold', name: 'Plates Dorées', desc: 'Classique, brillante' },
      { id: 'plate-white', name: 'Plates Blanches', desc: 'Pure, immaculée' },
      { id: 'plate-black', name: 'Plates Noires', desc: 'Sombre, imposante' },
      { id: 'plate-ornate', name: 'Plates Cisellées', desc: 'Ornées, rituelles' },
      { id: 'half-plate', name: 'Demi-Plates', desc: 'Mobile, pratique' },
      { id: 'crusader', name: 'Croisé', desc: 'Surcot blanc, croix rouge' }
    ],
    ranger: [
      { id: 'leather-green', name: 'Cuir Forestier', desc: 'Camouflage naturel' },
      { id: 'leather-brown', name: 'Cuir Brun', desc: 'Classique, usé' },
      { id: 'cloak-hood', name: 'Cape à Capuche', desc: 'Furtive, chaude' },
      { id: 'studded', name: 'Cuir Clouté', desc: 'Renforcé, défensif' },
      { id: 'ranger-dark', name: 'Sombre', desc: 'Nuit, ombre' },
      { id: 'wild', name: 'Sauvage', desc: 'Peaux, os, nature' }
    ],
    bard: [
      { id: 'velvet-red', name: 'Velours Rouge', desc: 'Passion, scène' },
      { id: 'velvet-blue', name: 'Velours Bleu', desc: 'Noble, mystique' },
      { id: 'velvet-purple', name: 'Velours Violet', desc: 'Magique, rêve' },
      { id: 'doublet-gold', name: 'Doublet Doré', desc: 'Riche, flamboyant' },
      { id: 'harlequin', name: 'Arlequin', desc: 'Coloré, théâtral' },
      { id: 'minstrel', name: 'Ménestrel', desc: 'Simple, authentique' }
    ],
    alchemist: [
      { id: 'apron-leather', name: 'Tablier Cuir', desc: 'Pratique, taché' },
      { id: 'apron-cloth', name: 'Tablier Toile', desc: 'Propre, fonctionnel' },
      { id: 'robe-alchemist', name: 'Robe Alchimique', desc: 'Longue, poches' },
      { id: 'coat-long', name: 'Long Manteau', desc: 'Protection, style' },
      { id: 'apron-heavy', name: 'Tablier Lourd', desc: 'Renforcé, industriel' },
      { id: 'scholar', name: 'Savant', desc: 'Érudit, sobre' }
    ]
  },

  // Headgear
  HEADGEAR: [
    { id: 'none', name: 'Aucun' },
    { id: 'circlet', name: 'Serre-tête / Diadème' },
    { id: 'crown-simple', name: 'Couronne Simple' },
    { id: 'crown-ornate', name: 'Couronne Ornée' },
    { id: 'helmet-open', name: 'Heaum Ouvert' },
    { id: 'helmet-full', name: 'Grande Heaume' },
    { id: 'hood-up', name: 'Capuche Relevée' },
    { id: 'hood-down', name: 'Capuche Baissée' },
    { id: 'hat-wide', name: 'Chapeau à Large Bord' },
    { id: 'tricorne', name: 'Tricorne' },
    { id: 'bandana', name: 'Bandana' },
    { id: 'headband', name: 'Bandeau' },
    { id: 'feathers', name: 'Plumes' },
    { id: 'horns-small', name: 'Petites Cornes' },
    { id: 'horns-large', name: 'Grandes Cornes' }
  ],

  // Artifacts
  ARTIFACTS: [
    { id: 'none', name: 'Rien' },
    { id: 'scroll', name: 'Parchemin Runique' },
    { id: 'dagger', name: 'Dague Runique' },
    { id: 'sword', name: 'Épée Longue' },
    { id: 'staff', name: 'Bâton Magique' },
    { id: 'orb', name: 'Orbe de Pouvoir' },
    { id: 'potion', name: 'Fiole Alchimique' },
    { id: 'quill', name: 'Calame Doré' },
    { id: 'lute', name: 'Luth de Barde' },
    { id: 'bow', name: 'Arc Composite' },
    { id: 'hammer', name: 'Marteau de Guerre' },
    { id: 'shield', name: 'Bouclier' },
    { id: 'torch', name: 'Torche' },
    { id: 'book', name: 'Grimoire Ouvert' }
  ],

  // Auras
  AURAS: [
    { id: 'none', name: 'Aucune', color: 'transparent' },
    { id: 'gold', name: 'Dorée (Lumière)', color: '#e4bf70' },
    { id: 'violet', name: 'Violette (Arcane)', color: '#a88cff' },
    { id: 'cyan', name: 'Cyan (Technomancie)', color: '#5cdbe2' },
    { id: 'emerald', name: 'Émeraude (Nature)', color: '#65c29a' },
    { id: 'ember', name: 'Braise (Feu)', color: '#f59e0b' },
    { id: 'shadow', name: 'Ombre (Néant)', color: '#584068' },
    { id: 'blood', name: 'Sang (Vitalité)', color: '#b83030' },
    { id: 'frost', name: 'Givre (Glace)', color: '#70c0e8' },
    { id: 'storm', name: 'Tempête (Foudre)', color: '#e0d040' },
    { id: 'holy', name: 'Sacrée (Divin)', color: '#f8f0d0' }
  ],

  // Frames
  FRAMES: [
    { id: 'classic', name: 'Classique' },
    { id: 'ornate', name: 'Ciselé' },
    { id: 'runic', name: 'Runique' },
    { id: 'nature', name: 'Nature' },
    { id: 'dark', name: 'Sombre' },
    { id: 'minimal', name: 'Minimaliste' },
    { id: 'parchment', name: 'Parchemin' },
    { id: 'metal', name: 'Métal' }
  ],

  // Backdrops
  BACKDROPS: [
    { id: 'fortress', name: 'Forteresse', desc: 'Murs de pierre, bannières', color: '#e4bf70' },
    { id: 'crypt', name: 'Crypte Runique', desc: 'Pierres anciennes, runes', color: '#a88cff' },
    { id: 'forest', name: 'Forêt Brumeuse', desc: 'Arbres géants, lumière verte', color: '#65c29a' },
    { id: 'tavern', name: 'Taverne Chaleureuse', desc: 'Bois, feu, ambiance', color: '#e88030' },
    { id: 'lab', name: 'Laboratoire Mystique', desc: 'Fioles, cercles, magie', color: '#5cdbe2' },
    { id: 'mountain', name: 'Sommet Enneigé', desc: 'Altitude, vent, ciel', color: '#c8d8f0' },
    { id: 'desert', name: 'Désert Doré', desc: 'Dunes, soleil, chaleur', color: '#e4bf70' },
    { id: 'void', name: 'Néant Astral', desc: 'Étoiles, vide, mystère', color: '#584068' },
    { id: 'library', name: 'Bibliothèque Ancienne', desc: 'Livres, savoir, poussière', color: '#b89058' },
    { id: 'battlefield', name: 'Champ de Bataille', desc: 'Cendres, épées, gloire', color: '#b03030' }
  ],

  // Lightings
  LIGHTINGS: [
    { id: 'natural', name: 'Naturel', desc: 'Lumière du jour' },
    { id: 'golden-hour', name: 'Heure Dorée', desc: 'Chaud, doux' },
    { id: 'blue-hour', name: 'Heure Bleue', desc: 'Froid, mystérieux' },
    { id: 'candlelight', name: 'Chandelle', desc: 'Intime, vacillant' },
    { id: 'moonlight', name: 'Clair de Lune', desc: 'Argenté, surnaturel' },
    { id: 'firelight', name: 'Lumière du Feu', desc: 'Dramatique, chaud' },
    { id: 'magic', name: 'Magique', desc: 'Coloré, surnaturel' },
    { id: 'dark', name: 'Sombre', desc: 'Contraste élevé' },
    { id: 'high-contrast', name: 'Contraste Extrême', desc: 'Lisibilité max' }
  ],

  // Particles
  PARTICLES: [
    { id: 'none', name: 'Aucune' },
    { id: 'sparkles', name: 'Étincelles Dorées' },
    { id: 'magic-sparkles', name: 'Étincelles Magiques' },
    { id: 'embers', name: 'Braises' },
    { id: 'leaves', name: 'Feuilles' },
    { id: 'snow', name: 'Neige' },
    { id: 'dust', name: 'Poussière / Motes' },
    { id: 'bubbles', name: 'Bulles' },
    { id: 'runes', name: 'Runes Flottantes' },
    { id: 'feathers', name: 'Plumes' }
  ],

  // Classes
  CLASSES: {
    paladin: {
      id: 'paladin', name: 'Paladin', role: 'Le Bâtisseur', spec: 'Cadrage & Livrables',
      icon: 'shield', color: '#e4bf70', glow: 'rgba(228,191,112,.4)',
      defaultStats: { social: 3, speed: 4, channel: 2, chaos: 2 },
      armorName: 'Armure de Plates Dorée',
      bodyType: 'human', build: 'athletic', height: 'average',
      outfitPreset: 'plate-gold'
    },
    ranger: {
      id: 'ranger', name: 'Rôdeur', role: "L'Éclaireur", spec: 'Défrichage Solo & Tech',
      icon: 'compass', color: '#4dc397', glow: 'rgba(77,195,151,.4)',
      defaultStats: { social: 2, speed: 3, channel: 1, chaos: 4 },
      armorName: 'Cape & Harnais de Cuir',
      bodyType: 'elf', build: 'slender', height: 'tall',
      outfitPreset: 'leather-green'
    },
    bard: {
      id: 'bard', name: 'Barde', role: "L'Idéateur", spec: 'Pitch & Créativité',
      icon: 'mask', color: '#b389ff', glow: 'rgba(179,137,255,.4)',
      defaultStats: { social: 5, speed: 5, channel: 4, chaos: 5 },
      armorName: 'Doublet de Velours Brodé',
      bodyType: 'human', build: 'average', height: 'average',
      outfitPreset: 'velvet-red'
    },
    alchemist: {
      id: 'alchemist', name: 'Alchimiste', role: 'Le Finisseur', spec: 'Rigueur UX & Débug',
      icon: 'flask', color: '#5ccde2', glow: 'rgba(92,205,226,.4)',
      defaultStats: { social: 2, speed: 2, channel: 3, chaos: 1 },
      armorName: 'Tablier Cuir & Fioles',
      bodyType: 'human', build: 'average', height: 'average',
      outfitPreset: 'apron-leather'
    }
  },

  // Stat texts
  STAT_TEXTS: {
    social: [
      '',
      "Ermite en crypte : focus solo complet, n'aime pas être dérangé à l'improviste.",
      'Focus calme : préfère des points de synchro ponctuels et espacés.',
      "Équilibré : travail silencieux le matin, synchronisation d'équipe l'après-midi.",
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
      "Maître des tempêtes : s'épanouit dans l'improvisation et la pression de dernière minute."
    ]
  },

  // Grimoire snippets
  GRIMOIRE_SNIPPETS: {
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
  },

  // Default roster
  DEFAULT_GUILD_ROSTER: [
    {
      id: 'hero-001', name: 'Damoiselle Camille', guild: 'Équipe 1 • Datacrons',
      classKey: 'ranger', title: "L'Éclaireuse des API",
      stats: { social: 2, speed: 3, channel: 1, chaos: 4 },
      ultimate: 'Épluche la documentation technique et trouve la solution en solo.',
      weakness: 'Les réunions de 2 heures sans ordre du jour précis.',
      potion: 'Écris-moi sur Slack avec le lien du bug et laisse-moi 30 min.',
      appearance: { race: 'elf', skin: 'moon', build: 'slender', height: 'tall', posture: 'ready', face: 'oval', eyes: 'green', expression: 'determined', mark: 'freckles', facialHair: 'none', warpaint: 'none', hairStyle: 'braids', hairColor: 'red', hairHighlight: 'golden', outfit: 'leather-green', headgear: 'hood-up', artifact: 'dagger', aura: 'emerald', frame: 'nature', backdrop: 'forest', lighting: 'natural', particles: 'leaves' }
    },
    {
      id: 'hero-002', name: 'Mage Sofiane', guild: 'Équipe 2 • WebSpells',
      classKey: 'bard', title: "L'Orateur Inspiré",
      stats: { social: 5, speed: 5, channel: 4, chaos: 5 },
      ultimate: 'Structure des slides percutantes et donne l\'envie d\'avancer.',
      weakness: 'Le manque d\'enthousiasme et les silences gênants en réu.',
      potion: 'Prends un café avec moi pour rebondir sur une idée à la fois.',
      appearance: { race: 'human', skin: 'olive', build: 'average', height: 'average', posture: 'swagger', face: 'heart', eyes: 'hazel', expression: 'smirk', mark: 'none', facialHair: 'goatee', warpaint: 'none', hairStyle: 'curly-short', hairColor: 'black', hairHighlight: 'silver', outfit: 'velvet-blue', headgear: 'circlet', artifact: 'lute', aura: 'violet', frame: 'ornate', backdrop: 'tavern', lighting: 'candlelight', particles: 'sparkles' }
    },
    {
      id: 'hero-003', name: 'Docteur Yuna', guild: 'Équipe 3 • Algomanciens',
      classKey: 'alchemist', title: "L'Horlogère du Pixel",
      stats: { social: 2, speed: 2, channel: 3, chaos: 1 },
      ultimate: 'Traque les alignements foireux et rend le produit ultra pro.',
      weakness: 'Pousser du code à minuit sans tester sur mobile.',
      potion: 'Rappelle-moi la contrainte de temps pour qu\'on coupe dans les détails.',
      appearance: { race: 'human', skin: 'peach', build: 'average', height: 'short', posture: 'straight', face: 'oval', eyes: 'blue', expression: 'stern', mark: 'rune-forehead', facialHair: 'none', warpaint: 'geometric', hairStyle: 'topknot', hairColor: 'silver', hairHighlight: 'blue', outfit: 'robe-alchemist', headgear: 'glasses', artifact: 'potion', aura: 'cyan', frame: 'runic', backdrop: 'lab', lighting: 'magic', particles: 'bubbles' }
    },
    {
      id: 'hero-004', name: 'Sire Valérian', guild: 'Projet Fil Rouge #03',
      classKey: 'paladin', title: 'Le Bâtisseur Méthodique',
      stats: { social: 3, speed: 4, channel: 2, chaos: 2 },
      ultimate: 'Structure les sprints et découpe les tâches en jalons limpides.',
      weakness: 'Le silence de plus de 12h & les changements d\'objectifs la veille du jalon.',
      potion: 'Par message direct avec les 2 actions concrètes attendues.',
      appearance: { race: 'human', skin: 'peach', build: 'athletic', height: 'average', posture: 'straight', face: 'square', eyes: 'amber', expression: 'determined', mark: 'scar-eye', facialHair: 'stubble', warpaint: 'none', hairStyle: 'crew', hairColor: 'darkbrown', hairHighlight: 'none', outfit: 'plate-gold', headgear: 'none', artifact: 'scroll', aura: 'gold', frame: 'classic', backdrop: 'fortress', lighting: 'golden-hour', particles: 'sparkles' }
    }
  ]
};

export default GAME_DATA;