// Aetheria — Donjon du Maître du Jeu IA
// Carrousel narratif + talents par héros + vote de table + trophées.
import { GAME_DATA } from './data.js';

// ==========================================================================
// CONFIG
// ==========================================================================
const SYSTEM_PROMPT = `Tu es le Maître du Jeu d'un jeu de rôle d'équipe bienveillant et tactique.
Ton rôle est de tester la cohésion d'un groupe en transformant leurs modes de fonctionnement réels en énigmes de donjon.
Tu reçois la composition de l'équipe (noms, classes, kryptonites, potions), la friction et le nombre de scènes.

Règles de narration :
- Transforme la friction humaine en un piège, un monstre ou une malédiction fantastique.
- Ne blâme personne : valorise la complémentarité des profils.
- Force l'utilisation des potions de réanimation des fiches pour désamorcer la crise.
- Reste percutant, immersif (dark fantasy / aventure épique).
- Chaque scène fait 3 à 4 phrases, sans répéter l'intro. L'intro fait 4 à 6 phrases.

Tu DOIS répondre EXCLUSIVEMENT avec un objet JSON respectant cette structure :
{
  "dungeon_title": "Nom épique du donjon",
  "intro_narrative": "Texte d'introduction de 4-6 phrases",
  "scenes": [ { "title": "Titre de la scène 2", "text": "3-4 phrases" } ],
  "character_spotlights": [ { "character_name": "Nom", "challenge": "Ce qu'il/elle doit surmonter" } ],
  "reactions": [
    [ { "label": "Réplique spécifique à la scène", "echo": "Ce que cela change dans le groupe", "delta": 3 }, { "label": "...", "echo": "...", "delta": 1 }, { "label": "...", "echo": "...", "delta": -2 } ]
  ],
  "talent_options": [
    { "hero_id": "ID_EXACT_DU_HEROS", "hero_name": "Nom", "kind": "force|potion|krypto|risk", "label": "Action personnalisée", "outcome_text": "Conséquence concrète", "cohesion_delta": 10 }
  ],
  "debrief": {
    "success": "2-4 phrases : ce qui a fonctionné, en citant au moins deux héros et l'anomalie.",
    "failure": "2-4 phrases : ce qui a manqué, en citant au moins deux héros et l'anomalie.",
    "mirror_questions": ["Question de transfert spécifique", "Deuxième question", "Troisième question"],
    "profile_questions": [ { "hero_id": "ID_EXACT_DU_HEROS", "question": "Question miroir personnelle liée à sa kryptonite" } ],
    "pact_focus": "Un comportement concret à surveiller ou à instaurer dans le vrai projet."
  },
  "real_world_agreement": "Question de transfert pour le vrai projet"
}

Contraintes de personnalisation :
- reactions : une entrée par scène, intro incluse ; exactement 3 répliques par scène. Chaque réplique doit être liée à l'action de la scène et aux héros présents, jamais une formule générique. delta entre -3 et +3.
- talent_options : exactement 4 options par héros, une de chaque kind (force, potion, krypto, risk). Utilise l'ID exact fourni dans COMPOSITION. Le label et outcome_text doivent citer la classe, la kryptonite, la potion ou le rôle du héros ET un élément du donjon. Deltas indicatifs : force +8 à +12, potion +15 à +20, krypto +6 à +12, risk -10 à -6.
- debrief : analyse succès et échec distinctes, ancrées dans les profils et l'anomalie ; questions miroir spécifiques ; une question de profil par héros ; pact_focus actionnable.
- Aucun texte avant ou après le JSON.`;

const PROVIDERS = {
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o-mini', defaultBase: 'https://api.openai.com/v1', needsKey: true, hint: 'sk-…' },
  openrouter: { label: 'OpenRouter', defaultModel: 'openai/gpt-4o-mini', defaultBase: 'https://openrouter.ai/api/v1', needsKey: true, hint: 'sk-or-…' },
  anthropic: { label: 'Anthropic (Claude)', defaultModel: 'claude-3-5-haiku-latest', defaultBase: 'https://api.anthropic.com/v1', needsKey: true, hint: 'sk-ant-…' },
  ollama: { label: 'Ollama local', defaultModel: 'llama3.1', defaultBase: 'http://localhost:11434', needsKey: false, hint: 'aucune clé requise' }
};

const SETTINGS_KEY = 'aetheria_dungeon_ia';
const TROPHY_KEY = 'aetheria_dungeon_trophies_v1';

export const DUNGEON_ANOMALIES = [
  { id: 'golem', name: 'Le Golem du Porteur Solitaire', icon: 'i-hammer', desc: 'Un membre fait tout en solo, se fatigue et finit frustré.' },
  { id: 'spectre', name: 'Le Spectre du Brouillard', icon: 'i-wind', desc: 'Manque de clarté, timidité, personnes paumées qui n’osent pas demander.' },
  { id: 'hydre', name: 'L’Hydre du Débat Infini', icon: 'i-mask', desc: 'Divergence de vision, dispersion, aucune décision tranchée.' },
  { id: 'custom', name: 'Anomalie sur-mesure', icon: 'i-quill', desc: 'Décris librement la friction observée dans ton équipe.' }
];

export const CAMPAIGN_LENGTHS = [
  { id: 'short', name: 'Courte', scenes: 2, desc: '2 scènes' },
  { id: 'standard', name: 'Standard', scenes: 3, desc: '3 scènes' },
  { id: 'epic', name: 'Épique', scenes: 4, desc: '4 scènes' }
];

const STAT_LABELS = { social: 'Mana Social', speed: 'Initiative', channel: 'Canal', chaos: 'Pivots' };

const ANOMALY_CONTEXT = {
  golem: { place: 'le bastion', threat: 'le Golem' },
  spectre: { place: 'la brume', threat: 'le Spectre' },
  hydre: { place: 'l’arène', threat: 'l’Hydre' },
  custom: { place: 'le couloir de l’Écho', threat: 'l’Écho' }
};

const SCENE_REACTIONS = [
  [
    { id: 'observe', label: 'Observer le piège avant de bouger', delta: 1, echo: 'Tu repères un détail que les autres ont manqué.' },
    { id: 'name', label: 'Nommer à voix haute ce que ressent le groupe', delta: 3, echo: 'Le groupe se sent vu ; la tension baisse d’un cran.' },
    { id: 'rush', label: 'Foncer pour ne pas subir', delta: -2, echo: 'L’action avance, mais la prudence recule.' }
  ],
  [
    { id: 'shield', label: 'Protéger un allié en difficulté', delta: 2, echo: 'Un héros se sent soutenu et ose continuer.' },
    { id: 'ask', label: 'Poser la question que personne n’ose poser', delta: 3, echo: 'La vérité circule, le piège perd une couche.' },
    { id: 'alone', label: 'Prendre tout sur soi pour avancer', delta: -3, echo: 'Le groupe avance, mais la fatigue se concentre.' }
  ],
  [
    { id: 'link', label: 'Relier les idées des autres', delta: 3, echo: 'Les morceaux s’assemblent en une décision commune.' },
    { id: 'decide', label: 'Proposer une décision claire', delta: 2, echo: 'Le groupe respire : il y a enfin une direction.' },
    { id: 'wait', label: 'Attendre que quelqu’un tranche', delta: -1, echo: 'Le silence s’installe et le donjon en profite.' }
  ]
];

function sceneOptions(index) { return SCENE_REACTIONS[Math.abs(index) % SCENE_REACTIONS.length]; }

const HERO_ACTIONS = {
  paladin: { verb: 'structure l’assaut dans', outcome: 'Les rôles se clarifient, chacun sait quoi porter.' },
  ranger: { verb: 'ouvre une voie dans', outcome: 'La voie apparaît là où le groupe ne regardait pas.' },
  bard: { verb: 'fait résonner sa voix dans', outcome: 'Les voix se libèrent et la peur change de nom.' },
  alchemist: { verb: 'désamorce le mécanisme dans', outcome: 'Le piège se démonte sans casser le groupe.' }
};

const INTERLUDES = [
  { title: 'Le Seuil des Noms', text: 'Le donjon marque une pause. Sur la pierre, les noms des héros apparaissent, chacun suivi d’une phrase entendue lors d’une vraie réunion. Personne ne peut avancer sans reconnaître la sienne.' },
  { title: 'La Salle du Silence', text: 'Un silence épais tombe sur la salle. Pour la première fois, le groupe entend ce qu’il évite de dire. Une fissure lumineuse attend une réponse honnête.' },
  { title: 'Le Passage des Mains', text: 'Le passage exige quatre mains, puis trois, puis deux. Chaque retrait volontaire fait avancer la porte. Lâcher prise n’est pas abandonner.' }
];

// ==========================================================================
// TROPHÉES
// ==========================================================================
function defaultStats() {
  return {
    started: 0, completed: 0, maxSquad: 0, nat20: 0, nat1: 0,
    maxCohesion: 0, minCohesion: 100, anomalies: {}, llmCompleted: 0,
    epicCompleted: 0, pacts: 0, coopChoices: 0, recklessSuccess: 0,
    customUsed: 0, lengths: {}
  };
}

const TIER_NAMES = { bronze: 'Bronze', silver: 'Argent', gold: 'Or', platinum: 'Platine' };

export const TROPHIES = [
  { id: 'first_portal', name: 'Premier Pas', desc: 'Franchir le portail du donjon pour la première fois.', tier: 'bronze', icon: 'i-dungeon', check: s => s.started >= 1 },
  { id: 'first_pact', name: 'Sceau d’Équipe', desc: 'Terminer une campagne et sortir du donjon.', tier: 'bronze', icon: 'i-scroll', check: s => s.completed >= 1 },
  { id: 'full_squad', name: 'Compagnie Complète', desc: 'Lancer une quête avec 5 héros.', tier: 'silver', icon: 'i-users', check: s => s.maxSquad >= 5 },
  { id: 'nat20', name: 'Faveur du Destin', desc: 'Obtenir un 20 naturel sur le d20.', tier: 'gold', icon: 'i-star', check: s => s.nat20 >= 1 },
  { id: 'nat1', name: 'Le Destin Rit', desc: 'Obtenir un 1 naturel sur le d20.', tier: 'bronze', icon: 'i-dice', check: s => s.nat1 >= 1 },
  { id: 'cohesion_gold', name: 'Cœur de Groupe', desc: 'Terminer une campagne avec une cohésion ≥ 80.', tier: 'gold', icon: 'i-heart', check: s => s.maxCohesion >= 80 },
  { id: 'humility', name: 'Leçon d’Humilité', desc: 'Terminer une campagne avec une cohésion < 35.', tier: 'silver', icon: 'i-skull', check: s => s.completed >= 1 && s.minCohesion < 35 },
  { id: 'anomaly_hunter', name: 'Chasseur d’Anomalies', desc: 'Affronter les 4 anomalies du donjon.', tier: 'gold', icon: 'i-crown', check: s => Object.keys(s.anomalies || {}).length >= 4, progress: s => [Math.min(Object.keys(s.anomalies || {}).length, 4), 4] },
  { id: 'oracle', name: 'L’Éveil de l’Oracle', desc: 'Terminer une campagne en mode LLM connecté.', tier: 'silver', icon: 'i-eye', check: s => s.llmCompleted >= 1 },
  { id: 'long_road', name: 'La Longue Route', desc: 'Terminer une campagne Épique (4 scènes).', tier: 'silver', icon: 'i-map', check: s => s.epicCompleted >= 1 },
  { id: 'archivist', name: 'Archiviste', desc: 'Graver 3 Pactes d’Équipe.', tier: 'silver', icon: 'i-book', check: s => s.pacts >= 3, progress: s => [Math.min(s.pacts, 3), 3] },
  { id: 'veteran', name: 'Vétéran du Donjon', desc: 'Terminer 5 campagnes.', tier: 'gold', icon: 'i-shield', check: s => s.completed >= 5, progress: s => [Math.min(s.completed, 5), 5] },
  { id: 'helping_hand', name: 'Main Tendue', desc: 'Choisir 3 actions coopératives.', tier: 'bronze', icon: 'i-heart', check: s => s.coopChoices >= 3, progress: s => [Math.min(s.coopChoices, 3), 3] },
  { id: 'no_net', name: 'Sans Filet', desc: 'Réussir une action impulsive et risquée.', tier: 'bronze', icon: 'i-bolt', check: s => s.recklessSuccess >= 1 },
  { id: 'storyteller', name: 'Conteur', desc: 'Affronter une anomalie sur-mesure.', tier: 'bronze', icon: 'i-quill', check: s => s.customUsed >= 1 },
  { id: 'explorer', name: 'Tour du Donjon', desc: 'Terminer les 3 longueurs de campagne.', tier: 'gold', icon: 'i-compass', check: s => Object.keys(s.lengths || {}).length >= 3, progress: s => [Math.min(Object.keys(s.lengths || {}).length, 3), 3] },
  { id: 'master', name: 'Maître du Donjon', desc: 'Débloquer tous les autres trophées.', tier: 'platinum', icon: 'i-trophy', secret: true }
];

class TrophyStore {
  constructor() { this.data = this.load(); }
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(TROPHY_KEY) || 'null');
      if (saved && saved.stats) {
        return { unlocked: saved.unlocked || {}, stats: { ...defaultStats(), ...saved.stats, anomalies: { ...(saved.stats.anomalies || {}) }, lengths: { ...(saved.stats.lengths || {}) } } };
      }
    } catch (e) { /* ignore */ }
    return { unlocked: {}, stats: defaultStats() };
  }
  save() { try { localStorage.setItem(TROPHY_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } }
  unlock(id) {
    if (this.data.unlocked[id]) return null;
    const t = TROPHIES.find(x => x.id === id);
    if (!t) return null;
    this.data.unlocked[id] = Date.now();
    return t;
  }
  evaluate() {
    const newly = [];
    TROPHIES.forEach(t => {
      if (t.id === 'master' || this.data.unlocked[t.id]) return;
      if (t.check && t.check(this.data.stats)) {
        const u = this.unlock(t.id);
        if (u) newly.push(u);
      }
    });
    if (!this.data.unlocked.master && TROPHIES.filter(t => t.id !== 'master').every(t => this.data.unlocked[t.id])) {
      const u = this.unlock('master');
      if (u) newly.push(u);
    }
    if (newly.length) this.save();
    return newly;
  }
  count() { return Object.keys(this.data.unlocked).length; }
}

// ==========================================================================
// SERVICE LLM
// ==========================================================================
export class DungeonMasterService {
  constructor(config = {}) { this.config = { mode: 'mock', provider: 'openai', model: PROVIDERS.openai.defaultModel, apiKey: '', baseUrl: '', accessCode: '', ...config }; }

  async generateCampaign({ squad, anomaly, customAnomaly, sceneCount = 3 }) {
    if (this.config.mode === 'proxy') {
      return { campaign: await this._callProxy({ squad, anomaly, customAnomaly, sceneCount }), source: 'llm' };
    }
    if (this.config.mode !== 'llm') return { campaign: buildMockCampaign(squad, anomaly, customAnomaly, sceneCount), source: 'mock' };
    return { campaign: await this._callLLM({ squad, anomaly, customAnomaly, sceneCount }), source: 'llm' };
  }

  async _callProxy({ squad, anomaly, customAnomaly, sceneCount }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 150000);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.config.accessCode) headers['x-aetheria-llm-code'] = this.config.accessCode;
      const res = await fetch('/api/llm/campaign', {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          squad: squad.map(h => ({
            id: h.id, name: h.name, classKey: h.classKey,
            weakness: h.weakness || '', potion: h.potion || '', stats: h.stats || {}
          })),
          anomaly,
          customAnomaly,
          sceneCount
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.error || `Serveur LLM HTTP ${res.status}`);
        error.status = res.status;
        throw error;
      }
      if (!data.campaign) throw new Error('Le serveur LLM a renvoyé une campagne vide.');
      return normalizeCampaign(data.campaign);
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Le serveur LLM n’a pas répondu à temps (150 s).');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  _buildUserPrompt({ squad, anomaly, customAnomaly, sceneCount }) {
    const roster = squad.map((h, i) => {
      const cls = GAME_DATA.CLASSES[h.classKey] || {};
      const stat = dominantStat(h.stats || {});
      return `${i + 1}. [id: ${h.id || `hero-${i}`}] ${h.name || 'Aventurier'} — ${cls.name || '?'} (${cls.role || '?'}) — Force : ${stat.label} ${stat.value}/5 — Kryptonite : ${h.weakness || 'non renseignée'} — Potion : ${h.potion || 'non renseignée'}`;
    }).join('\n');
    const anomalyText = anomaly === 'custom'
      ? `Anomalie sur-mesure : ${customAnomaly}`
      : `${DUNGEON_ANOMALIES.find(a => a.id === anomaly)?.name || anomaly} — ${DUNGEON_ANOMALIES.find(a => a.id === anomaly)?.desc || ''}`;
    return `COMPOSITION (${squad.length} héros) :\n${roster}\n\nFRICTION :\n${anomalyText}\n\nNOMBRE TOTAL DE SCÈNES : ${sceneCount} (intro incluse). Fournis ${Math.max(1, sceneCount - 1)} scène(s) dans "scenes". Réponds uniquement avec le JSON.`;
  }

  async _callLLM({ squad, anomaly, customAnomaly, sceneCount }) {
    const cfg = this.config;
    const provider = PROVIDERS[cfg.provider] || PROVIDERS.openai;
    const base = (cfg.baseUrl || provider.defaultBase).replace(/\/+$/, '');
    const model = cfg.model || provider.defaultModel;
    const userPrompt = this._buildUserPrompt({ squad, anomaly, customAnomaly, sceneCount });
    if (provider.needsKey && !cfg.apiKey) throw new Error('Clé API manquante pour le mode LLM.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      let raw;
      if (cfg.provider === 'anthropic') {
        const res = await fetch(`${base}/messages`, {
          method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model, max_tokens: 3000, temperature: 0.8, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userPrompt }] })
        });
        if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
        const data = await res.json();
        raw = (data.content || []).map(p => p.text || '').join('\n');
      } else if (cfg.provider === 'ollama') {
        const res = await fetch(`${base}/api/chat`, {
          method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, stream: false, format: 'json', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }], options: { temperature: 0.8 } })
        });
        if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
        const data = await res.json();
        raw = data.message?.content;
      } else {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` };
        if (cfg.provider === 'openrouter') { headers['HTTP-Referer'] = location.origin; headers['X-Title'] = 'Aetheria — Donjon'; }
        const res = await fetch(`${base}/chat/completions`, {
          method: 'POST', signal: controller.signal, headers,
          body: JSON.stringify({ model, temperature: 0.8, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }] })
        });
        if (!res.ok) throw new Error(`${provider.label} HTTP ${res.status}`);
        const data = await res.json();
        raw = data.choices?.[0]?.message?.content;
      }
      return normalizeCampaign(parseJsonObject(raw));
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Le Maître du Jeu n’a pas répondu à temps (45 s).');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

// ==========================================================================
// PARSING
// ==========================================================================
function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('La réponse du LLM ne contient pas de JSON.');
  try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { throw new Error('JSON invalide renvoyé par le LLM.'); }
}

function normalizeCampaign(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Réponse vide.');
  const title = String(obj.dungeon_title || '').trim();
  const intro = String(obj.intro_narrative || '').trim();
  if (!title || !intro) throw new Error('Le donjon généré est incomplet.');
  const scenes = Array.isArray(obj.scenes)
    ? obj.scenes.slice(0, 3).map((s, i) => ({ title: String(s.title || `Scène ${i + 2}`).trim(), text: String(s.text || '').trim() })).filter(s => s.text)
    : [];
  const spotlights = Array.isArray(obj.character_spotlights)
    ? obj.character_spotlights.map(s => ({ character_name: String(s.character_name || '').trim(), challenge: String(s.challenge || '').trim() })).filter(s => s.character_name)
    : [];
  const reactions = Array.isArray(obj.reactions)
    ? obj.reactions.map((group, groupIndex) => Array.isArray(group)
      ? group.slice(0, 3).map((option, i) => ({
        id: String(option.id || `r${groupIndex}-${i}`),
        label: String(option.label || '').trim(),
        echo: String(option.echo || '').trim(),
        delta: Number.isFinite(Number(option.delta)) ? Math.round(Number(option.delta)) : 0
      })).filter(option => option.label)
      : []).filter(group => group.length >= 2)
    : [];
  const talentOptions = Array.isArray(obj.talent_options)
    ? obj.talent_options.map(option => ({
      id: String(option.id || ''),
      hero_id: String(option.hero_id || ''),
      hero_name: String(option.hero_name || '').trim(),
      kind: String(option.kind || ''),
      label: String(option.label || '').trim(),
      outcome_text: String(option.outcome_text || '').trim(),
      cohesion_delta: Number.isFinite(Number(option.cohesion_delta)) ? Math.round(Number(option.cohesion_delta)) : 0
    })).filter(option => option.hero_id && ['force', 'potion', 'krypto', 'risk'].includes(option.kind) && option.label && option.outcome_text)
    : [];
  const rawDebrief = obj.debrief && typeof obj.debrief === 'object' ? obj.debrief : null;
  const debrief = rawDebrief ? {
    success: String(rawDebrief.success || '').trim(),
    failure: String(rawDebrief.failure || '').trim(),
    mirror_questions: Array.isArray(rawDebrief.mirror_questions) ? rawDebrief.mirror_questions.map(q => String(q || '').trim()).filter(Boolean).slice(0, 4) : [],
    profile_questions: Array.isArray(rawDebrief.profile_questions) ? rawDebrief.profile_questions.map(item => ({ hero_id: String(item.hero_id || ''), question: String(item.question || '').trim() })).filter(item => item.question) : [],
    pact_focus: String(rawDebrief.pact_focus || '').trim()
  } : null;
  return {
    dungeon_title: title,
    intro_narrative: intro,
    scenes,
    character_spotlights: spotlights,
    reactions,
    talent_options: talentOptions,
    debrief,
    real_world_agreement: String(obj.real_world_agreement || '').trim(),
    source: 'llm'
  };
}

// ==========================================================================
// CAMPAGNES DE DÉMONSTRATION
// ==========================================================================
function buildMockCampaign(squad, anomaly, customAnomaly, sceneCount = 3) {
  const custom = String(customAnomaly || '').trim() || 'une friction que personne n’ose nommer';
  const spotlights = squad.map(h => {
    const cls = GAME_DATA.CLASSES[h.classKey] || {};
    const weakness = (h.weakness || '').trim() || 'le doute qui s’installe quand personne ne parle';
    return { character_name: h.name || 'Aventurier', challenge: `${cls.role || 'Aventurier'} — sa kryptonite « ${weakness} » résonne avec le piège.` };
  });

  const campaigns = {
    golem: {
      dungeon_title: 'Le Bastion des Mille Charges',
      intro_narrative: `Sous la Forge, un escalier de pierre descend vers un bastion oublié. Depuis trois lunes, un golem d’obsidienne y porte seul des caisses de minerai, et le plafond pèse sur ses épaules. À chaque pas, la roche se fissure ; dans chaque fissure apparaît une tâche non déléguée. Les autres créatures ont cessé de l’aider — il ne demande jamais. Si personne ne l’arrête, le bastion s’effondrera sur lui, et l’équipe avec.`,
      scenes: [
        { title: 'La Salle des Épaules', text: 'Le golem avance dans un couloir bas où résonnent des soupirs de pierre. Sur ses épaules, les caisses portent des noms de projets et de nuits blanches. Une voix minérale murmure : « C’est plus rapide si je le fais moi-même. » Le plafond craque et laisse tomber une pluie de poussière dorée.' },
        { title: 'Le Pont des Relais', text: 'Le passage se resserre en un pont de cordes au-dessus du vide. Quatre ancrages attendent des mains, mais le golem refuse de lâcher sa charge. Chaque caisse déposée fait remonter le pont d’un pouce, comme si le donjon récompensait le partage.' },
        { title: 'Le Cœur du Golem', text: 'Au centre du bastion, un cœur de braise bat dans une cage de fer. Il contient la fatigue de tous ceux qui ont porté sans être vus. Le golem pose un genou à terre : « Qui portera quoi, désormais ? »' }
      ],
      real_world_agreement: 'Qui dépose quelle charge dès demain, et à quel moment l’équipe vérifie-t-elle les épaules de chacun ?'
    },
    spectre: {
      dungeon_title: 'Les Brumes du Chapitre Perdu',
      intro_narrative: `Un brouillard laiteux avale les couloirs de la bibliothèque interdite ; les torches n’éclairent plus qu’à trois pas. Le Spectre du Brouillard murmure des questions sans réponses : « où va-t-on ? », « qui décide ? », « est-ce que quelqu’un comprend ? ». Ceux qui savent se taisent, et ceux qui ne savent pas n’osent pas demander. L’équipe avance en file, chacun persuadé d’être le seul perdu.`,
      scenes: [
        { title: 'Le Couloir des Questions', text: 'Chaque question non posée devient une main froide sur une épaule. Le brouillard avale les mots trop assurés et laisse passer les hésitations. Une inscription s’allume au sol : « Ici, ne pas savoir est une porte. »' },
        { title: 'La Lanterne des Aveux', text: 'Au centre d’un cercle de pierres, une lanterne attend. Elle reste noire tant que quelqu’un prétend avoir tout compris. Quand une voix fragile dit « je ne comprends pas », une flamme bleue naît et repousse la brume.' },
        { title: 'Le Cercle des Voix', text: 'Le Spectre dessine l’équipe en ombres qui s’éloignent. Une seule phrase peut les rapprocher : nommer ce que chacun craint de ne pas savoir. Le brouillard attend une réponse qui ne soit pas un silence poli.' }
      ],
      real_world_agreement: 'Qui ose dire « je suis perdu » cette semaine, et comment l’équipe protège-t-elle cette parole ?'
    },
    hydre: {
      dungeon_title: 'L’Arène des Trois Têtes',
      intro_narrative: `Au fond du donjon s’ouvre une arène de sable noir où trois têtes de l’Hydre du Débat Infini émergent tour à tour. Chacune tient une vérité différente, et chaque argument en réveille une autre. Le sablier géant égrène les minutes : à minuit, les portes se scelleront. Personne ne veut perdre la face ; le trésor — la décision — reste hors d’atteinte.`,
      scenes: [
        { title: 'Le Sable des Minutes', text: 'À chaque répétition d’un argument, le sable du sablier rougit. Les têtes de l’Hydre sourient : elles se nourrissent des débats qui tournent en rond. Une voix grave annonce que la première décision claire fera tomber une tête.' },
        { title: 'Le Miroir des Trois Têtes', text: 'Trois miroirs s’élèvent du sable. Dans le premier, quelqu’un a besoin d’être entendu ; dans le second, de trancher ; dans le troisième, d’avancer. Les trois besoins sont vrais, mais aucun ne peut attendre indéfiniment.' },
        { title: 'Le Trésor du Verdict', text: 'Au centre de l’arène brille une pièce unique : la décision. Quiconque la saisit sans consensus se brûle la main. L’Hydre penche ses trois têtes, curieuse de voir si le groupe sait choisir sans se déchirer.' }
      ],
      real_world_agreement: 'Quelle décision devez-vous trancher avant vendredi, et qui tient le sablier du vote ?'
    },
    custom: {
      dungeon_title: 'Le Donjon de l’Écho',
      intro_narrative: `Une faille s’ouvre dans la Forge et répète en boucle : « ${custom} ». L’écho prend la forme d’un couloir qui se tord à chaque tentative d’explication. Plus l’équipe parle fort, plus le passage se referme ; plus elle accuse, plus les murs se rapprochent. Au fond, une porte attend, gravée d’un seul mot : « nomme ».`,
      scenes: [
        { title: 'Le Mur des Mots', text: 'Les murs se couvrent des phrases prononcées ces dernières semaines. Certaines brillent, d’autres brûlent. L’écho ne juge pas : il rend à l’équipe ce qu’elle a dit tout bas.' },
        { title: 'La Fontaine du Silence', text: 'Une fontaine d’eau noire étouffe les voix trop fortes. Pour l’entendre, il faut parler sans accuser. Chaque phrase juste fait monter une marche ; chaque reproche la fait disparaître.' },
        { title: 'La Porte du Nom', text: 'La porte finale n’a ni serrure ni poignée, seulement un creux en forme de mot. L’écho attend que l’équipe nomme la friction — pas la personne.' }
      ],
      real_world_agreement: `Comment allez-vous traiter « ${custom} » concrètement dès la prochaine réunion ?`
    }
  };

  const key = campaigns[anomaly] ? anomaly : 'custom';
  const campaign = JSON.parse(JSON.stringify(campaigns[key]));
  const wanted = Math.max(1, Math.min(3, (sceneCount || 3) - 1));
  campaign.scenes = (campaign.scenes || []).slice(0, wanted);
  campaign.character_spotlights = spotlights;
  campaign.source = 'mock';
  return campaign;
}

// ==========================================================================
// TALENTS PAR HÉROS
// ==========================================================================
function buildTalentOptions(squad, anomaly) {
  const ctx = ANOMALY_CONTEXT[anomaly] || ANOMALY_CONTEXT.custom;
  const options = [];
  squad.forEach((hero, index) => {
    const key = hero.id || `hero-${index}`;
    const cls = GAME_DATA.CLASSES[hero.classKey] || {};
    const act = HERO_ACTIONS[hero.classKey] || HERO_ACTIONS.paladin;
    const stat = dominantStat(hero.stats || {});
    const weakness = (hero.weakness || '').trim() || 'une kryptonite encore tacite';
    const potion = (hero.potion || '').trim() || '« on nomme la tension avant de décider »';
    const name = hero.name || 'Aventurier';

    options.push({
      id: `${key}:force`, hero_id: key, hero_name: name, kind: 'force',
      label: `${name} mobilise ${stat.label} ${stat.value}/5 et ${act.verb} ${ctx.place}`,
      outcome_text: `${act.outcome} Sa force dominante devient un appui pour tout le groupe.`,
      cohesion_delta: 8 + stat.value
    });
    options.push({
      id: `${key}:potion`, hero_id: key, hero_name: name, kind: 'potion',
      label: `${name} lit sa Potion « ${potion} » et ouvre un espace de parole`,
      outcome_text: `La potion « ${potion} » désamorce la crise : chacun dépose sa peur sans accusation.`,
      cohesion_delta: 18
    });
    options.push({
      id: `${key}:krypto`, hero_id: key, hero_name: name, kind: 'krypto',
      label: `${name} nomme sa kryptonite « ${weakness} » et demande un relais`,
      outcome_text: `Nommer « ${weakness} » à voix haute transforme le fardeau en signal que l’équipe sait lire.`,
      cohesion_delta: 10
    });
    options.push({
      id: `${key}:risk`, hero_id: key, hero_name: name, kind: 'risk',
      label: `${name} laisse sa kryptonite décider et fonce seul`,
      outcome_text: `La kryptonite « ${weakness} » prend le volant : le groupe avance, mais la confiance se fissure.`,
      cohesion_delta: -8
    });
  });
  return options;
}

function mergeTalentOptions(campaign, squad, anomaly) {
  const fallback = buildTalentOptions(squad, anomaly);
  const fallbackByKey = new Map(fallback.map(option => [`${option.hero_id}:${option.kind}`, option]));
  const providedByKey = new Map();
  const provided = Array.isArray(campaign && campaign.talent_options) ? campaign.talent_options : [];
  provided.forEach(option => {
    const hero = squad.find(h =>
      (option.hero_id && h.id === option.hero_id) ||
      (option.hero_name && String(h.name || '').toLowerCase() === String(option.hero_name).toLowerCase())
    );
    if (!hero) return;
    const heroId = hero.id || `hero-${squad.indexOf(hero)}`;
    const key = `${heroId}:${option.kind}`;
    if (['force', 'potion', 'krypto', 'risk'].includes(option.kind) && !providedByKey.has(key)) providedByKey.set(key, option);
  });
  const merged = [];
  squad.forEach((hero, index) => {
    const heroId = hero.id || `hero-${index}`;
    ['force', 'potion', 'krypto', 'risk'].forEach(kind => {
      const key = `${heroId}:${kind}`;
      const custom = providedByKey.get(key);
      const base = fallbackByKey.get(key);
      if (!custom && !base) return;
      const chosen = custom || base;
      merged.push({
        ...(base || {}),
        ...(chosen || {}),
        id: key,
        hero_id: heroId,
        hero_name: hero.name || 'Aventurier',
        kind,
        label: String(chosen.label || '').trim(),
        outcome_text: String(chosen.outcome_text || '').trim(),
        cohesion_delta: Number.isFinite(Number(chosen.cohesion_delta))
          ? Number(chosen.cohesion_delta)
          : (base ? base.cohesion_delta : 0)
      });
    });
  });
  return merged;
}

// ==========================================================================
// HELPERS
// ==========================================================================
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function dominantStat(stats) {
  const entries = Object.entries(stats || {}).filter(([k]) => STAT_LABELS[k]);
  if (!entries.length) return { key: 'social', label: STAT_LABELS.social, value: 3 };
  entries.sort((a, b) => b[1] - a[1]);
  return { key: entries[0][0], label: STAT_LABELS[entries[0][0]], value: entries[0][1] };
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      mode: saved.mode === 'proxy' || saved.mode === 'llm' ? saved.mode : 'mock',
      provider: PROVIDERS[saved.provider] ? saved.provider : 'openai',
      model: saved.model || '', apiKey: saved.apiKey || '', baseUrl: saved.baseUrl || '',
      accessCode: saved.accessCode || '',
      campaignLength: CAMPAIGN_LENGTHS.some(l => l.id === saved.campaignLength) ? saved.campaignLength : 'standard',
      gameMode: saved.gameMode === 'table' ? 'table' : 'solo'
    };
  } catch (e) {
    return { mode: 'mock', provider: 'openai', model: '', apiKey: '', baseUrl: '', accessCode: '', campaignLength: 'standard', gameMode: 'solo' };
  }
}

function saveSettings(settings) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }
function todayLabel() { return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
function dateLabel(ts) { return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

// ==========================================================================
// CONTRÔLEUR
// ==========================================================================
export class DungeonGame {
  constructor({ getRoster, renderThumb, toast, sound }) {
    this.getRoster = getRoster;
    this.renderThumb = renderThumb;
    this.toast = toast || (() => {});
    this.sound = sound || (() => {});
    this.settings = loadSettings();
    this.service = new DungeonMasterService(this.settings);
    this.trophies = new TrophyStore();
    this.selected = new Set();
    this.anomaly = 'golem';
    this.customAnomaly = '';
    this.step = 'setup';
    this.campaign = null;
    this.timeline = [];
    this.sceneIndex = 0;
    this.cohesion = 50;
    this.talentOptions = [];
    this.soloPlan = {};
    this.soloReactions = {};
    this.questTrophies = [];
    this.busy = false;
    this.rolling = false;
    this.initialized = false;
    this.room = null;
    this.playerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.pollTimer = null;
    this.pollBusy = false;
    this.lastPhase = null;
    this.lastScene = null;
    this.pendingRoom = null;
    this.answerSubmitted = false;
    this.voteSubmitted = false;
    this.tableSelection = [];
    this.tableVoteSelection = [];
    this.tableNote = '';
    this.joinPrefill = '';
    this.setupPath = 'create';
    this.serverLlm = { loading: true, configured: false };
  }

  init() {
    if (this.initialized) return;
    this.cacheDom();
    if (!this.dom.view) return;
    this.bind();
    this.renderAnomalies();
    this.syncSettingsUI();
    this.renderSquad();
    this.renderTrophies();
    this.setSetupPath('create');
    this.showStep('setup');
    this.initialized = true;
    this.maybePrefillJoin();
    this.fetchServerLlmStatus();
  }

  cacheDom() {
    const $ = id => document.getElementById(id);
    this.dom = {
      view: document.querySelector('.view[data-view="dungeon"]'),
      squad: $('dj-squad'), squadCount: $('dj-squad-count'), monsters: $('dj-monsters'),
      customWrap: $('dj-custom-wrap'), custom: $('dj-custom'),
      modeMock: $('dj-mode-mock'), modeProxy: $('dj-mode-proxy'), modeLlm: $('dj-mode-llm'), llmConfig: $('dj-llm-config'),
      provider: $('dj-provider'), model: $('dj-model'), apiKey: $('dj-api-key'), baseUrl: $('dj-base-url'),
      proxyConfig: $('dj-proxy-config'), proxyStatus: $('dj-proxy-status'), proxyMeta: $('dj-proxy-meta'), proxyDot: $('dj-proxy-dot'),
      proxyCode: $('dj-proxy-code'), proxyCodeWrap: $('dj-proxy-code-wrap'), clearKey: $('dj-clear-key'),
      start: $('dj-start'),
      setup: $('dj-step-setup'), narration: $('dj-step-narration'), dilemma: $('dj-step-dilemma'), debrief: $('dj-step-debrief'),
      stepLabel: $('dj-step-label'), carousel: $('dj-carousel'), carouselTrack: $('dj-carousel-track'),
      sceneProgress: $('dj-scene-progress'), sceneDots: $('dj-scene-dots'), spotlights: $('dj-spotlights'),
      next: $('dj-next'), prev: $('dj-prev'), navHint: $('dj-nav-hint'),
      pathCreate: $('dj-path-create'), pathJoin: $('dj-path-join'),
      launch: $('dj-launch'), launchSquad: $('dj-launch-squad'), launchMeta: $('dj-launch-meta'), launchHint: $('dj-launch-hint'),
      dilemmaTitle: $('dj-dilemma-title'), dilemmaKicker: $('dj-dilemma-kicker'), dilemmaBrief: $('dj-dilemma-brief'), choices: $('dj-choices'),
      dice: $('dj-dice'), d20: $('dj-d20'), rollBtn: $('dj-roll'), diceResult: $('dj-dice-result'), rollHint: $('dj-roll-hint'), toDebrief: $('dj-to-debrief'),
      cohesionFill: $('dj-cohesion-fill'), cohesionVal: $('dj-cohesion-val'), cohesionState: $('dj-cohesion-state'), cohesionMeter: $('dj-cohesion-meter'),
      result: $('dj-result'), mirror: $('dj-mirror'), questTrophies: $('dj-quest-trophies'), debriefSummary: $('dj-debrief-summary'),
      pact: $('dj-pact'), pactStatus: $('dj-pact-status'), pactReset: $('dj-pact-reset'), pactCard: $('dj-pact-card'), toPact: $('dj-to-pact'),
      copy: $('dj-copy'), download: $('dj-download'), restart: $('dj-restart'), backSetup: $('dj-back-setup'),
      newDungeon: $('dj-new-dungeon'), replay: $('dj-replay'),
      loading: $('dj-loading'), loadingText: $('dj-loading-text'), fallback: $('dj-fallback'), squadHint: $('dj-squad-hint'),
      trophyRoom: $('dj-trophy-room'), trophyDetails: $('dj-trophy-details'), trophyChip: $('dj-trophy-chip-btn'), trophyBar: $('dj-trophy-bar-fill'),
      trophies: $('dj-trophies'), trophyCount: $('dj-trophy-count'),
      table: $('dj-table'), tableCode: $('dj-table-code'), tableCopy: $('dj-table-copy'),
      tablePlayers: $('dj-table-players'), tableStatus: $('dj-table-status'), tableControls: $('dj-table-controls'),
      joinCode: $('dj-join-code'), joinBtn: $('dj-join-btn'), joinStatus: $('dj-join-status'),
      joinPanel: $('dj-join-heroes'), joinTitle: $('dj-join-title'), joinHero: $('dj-join-hero'), joinConfirm: $('dj-join-confirm')
    };
  }

  bind() {
    const d = this.dom;
    d.modeMock?.addEventListener('click', () => this.setMode('mock'));
    d.modeProxy?.addEventListener('click', () => this.setMode('proxy'));
    d.modeLlm?.addEventListener('click', () => this.setMode('llm'));
    d.proxyCode?.addEventListener('input', () => {
      this.settings.accessCode = d.proxyCode.value.trim();
      this.persistSettings();
      this.updateLaunchSummary();
    });
    d.clearKey?.addEventListener('click', () => this.clearLocalKey());
    d.provider?.addEventListener('change', () => this.onProviderChange());
    d.model?.addEventListener('input', () => this.persistSettings());
    d.apiKey?.addEventListener('input', () => this.persistSettings());
    d.baseUrl?.addEventListener('input', () => this.persistSettings());
    d.custom?.addEventListener('input', () => { this.customAnomaly = d.custom.value; this.updateLaunchSummary(); });
    d.start?.addEventListener('click', () => this.startQuest());
    d.next?.addEventListener('click', () => this.nextScene());
    d.prev?.addEventListener('click', () => this.prevScene());
    d.rollBtn?.addEventListener('click', () => this.rollD20());
    d.toDebrief?.addEventListener('click', () => this.goToDebrief());
    d.copy?.addEventListener('click', () => this.copyPact());
    d.download?.addEventListener('click', () => this.downloadPact());
    d.pact?.addEventListener('input', () => this.onPactInput());
    d.pactReset?.addEventListener('click', () => this.resetPactTemplate());
    d.restart?.addEventListener('click', () => this.resetQuest());
    d.backSetup?.addEventListener('click', () => this.exitToSetup());
    d.newDungeon?.addEventListener('click', () => this.exitToSetup());
    d.replay?.addEventListener('click', () => { this.closeTableIfHost(); this.resetQuest(); });
    d.joinBtn?.addEventListener('click', () => this.checkJoinCode());
    d.joinConfirm?.addEventListener('click', () => this.confirmJoin());
    d.tableCopy?.addEventListener('click', () => this.copyTableLink());
    d.view?.querySelectorAll('.dj-path').forEach(btn => btn.addEventListener('click', () => this.setSetupPath(btn.dataset.path)));
    d.trophyChip?.addEventListener('click', () => this.openTrophyRoom());
    d.trophyDetails?.addEventListener('toggle', () => d.trophyChip?.setAttribute('aria-expanded', d.trophyDetails.open ? 'true' : 'false'));
    d.toPact?.addEventListener('click', () => d.pactCard?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    d.launchHint?.addEventListener('click', (e) => {
      if (e.target.closest('[data-goto-forge]')) document.querySelector('.top-tab[data-view="forge"]')?.click();
    });
    this.dom.view?.querySelectorAll('.dj-length-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.length) this.setLength(btn.dataset.length);
        if (btn.dataset.gamemode) this.setGameMode(btn.dataset.gamemode);
      });
    });
    this.bindCarouselScroll();
  }

  bindCarouselScroll() {
    const carousel = this.dom.carousel;
    if (!carousel || this._carouselScrollBound) return;
    this._carouselScrollBound = true;
    let timer;
    carousel.addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const idx = Math.round(carousel.scrollLeft / Math.max(1, carousel.clientWidth));
        if (idx === this.sceneIndex || !this.timeline.length) return;
        this.sceneIndex = clamp(idx, 0, this.timeline.length - 1);
        if (this.dom.sceneProgress) this.dom.sceneProgress.textContent = `Scène ${this.sceneIndex + 1} / ${this.timeline.length}`;
        this.dom.sceneDots?.querySelectorAll('[data-dot]').forEach(dot => dot.classList.toggle('is-on', Number(dot.dataset.dot) === this.sceneIndex));
        this.updateCarouselNav(!!(this.room && !this.isHost));
        if (this.room && this.isHost) this.syncScene();
      }, 180);
    });
  }

  onShow() {
    if (!this.initialized) this.init();
    this.renderSquad();
    this.renderTrophies();
  }

  // ---- Portail : créer ou rejoindre ------------------------------------
  setSetupPath(path) {
    this.setupPath = path === 'join' ? 'join' : 'create';
    const d = this.dom;
    if (d.pathCreate) d.pathCreate.hidden = this.setupPath !== 'create';
    if (d.pathJoin) d.pathJoin.hidden = this.setupPath !== 'join';
    if (d.launch) d.launch.hidden = this.setupPath !== 'create';
    d.view?.querySelectorAll('.dj-path').forEach(btn => {
      const on = btn.dataset.path === this.setupPath;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    d.view?.classList.toggle('has-launch', this.setupPath === 'create' && this.step === 'setup');
    if (this.setupPath === 'join') setTimeout(() => d.joinCode?.focus({ preventScroll: true }), 120);
    else this.updateLaunchSummary();
  }

  updateLaunchSummary() {
    const d = this.dom;
    if (!d.launchSquad || !d.launchMeta) return;
    const roster = this.getRoster() || [];
    const heroes = roster.filter(h => this.selected.has(h.id));
    d.launchSquad.innerHTML = heroes.length
      ? heroes.map(h => {
        const cls = GAME_DATA.CLASSES[h.classKey] || {};
        const initial = escapeHtml((h.name || '?').trim().charAt(0).toUpperCase() || '?');
        return `<span class="dj-launch-avatar" style="--class-color:${cls.color || '#e4bf70'}" title="${escapeHtml(h.name || 'Aventurier')}"><span class="dj-launch-avatar-fallback" aria-hidden="true">${initial}</span></span>`;
      }).join('')
      : '<span class="dj-launch-empty"><svg><use href="#i-users"/></svg> Aucun héros sélectionné</span>';
    d.launchSquad.querySelectorAll('.dj-launch-avatar').forEach((el, i) => {
      try { this.renderThumb(heroes[i].appearance, heroes[i].classKey, el, 72); } catch (e) { /* garde l'initiale */ }
    });

    const anomaly = DUNGEON_ANOMALIES.find(a => a.id === this.anomaly);
    const length = CAMPAIGN_LENGTHS.find(l => l.id === this.settings.campaignLength) || CAMPAIGN_LENGTHS[1];
    const provider = PROVIDERS[this.settings.provider] || PROVIDERS.openai;
    const engine = this.settings.mode === 'llm' ? provider.label : this.settings.mode === 'proxy' ? 'Serveur sécurisé' : 'Mode Démo';
    const engineIcon = this.settings.mode === 'llm' ? 'i-eye' : this.settings.mode === 'proxy' ? 'i-shield' : 'i-sparkles';
    const gameMode = this.settings.gameMode === 'table' ? 'Table de guilde' : 'Solo';
    const custom = this.anomaly === 'custom' && String(this.customAnomaly || '').trim();
    d.launchMeta.innerHTML = [
      `<li><svg><use href="#i-users"/></svg><span>${heroes.length}/5 héros</span></li>`,
      `<li><svg><use href="#${anomaly ? anomaly.icon : 'i-bolt'}"/></svg><span>${escapeHtml(custom ? String(this.customAnomaly).slice(0, 44) : (anomaly ? anomaly.name : 'Anomalie à choisir'))}</span></li>`,
      `<li><svg><use href="#i-scroll"/></svg><span>${escapeHtml(length.name)} · ${length.scenes} scènes</span></li>`,
      `<li><svg><use href="#${engineIcon}"/></svg><span>${escapeHtml(engine)} · ${gameMode}</span></li>`
    ].join('');

    const missingCustom = this.anomaly === 'custom' && !custom;
    const proxy = this.serverLlm || {};
    const missingProxyCode = this.settings.mode === 'proxy' && proxy.requiresCode && !String(this.settings.accessCode || '').trim();
    const proxyBlocked = this.settings.mode === 'proxy' && (proxy.loading || proxy.error || !proxy.configured || missingProxyCode);
    const valid = heroes.length >= 2 && roster.length >= 2 && !missingCustom && !this.busy && !proxyBlocked;
    if (d.start) d.start.disabled = !valid;
    if (d.launchHint) {
      if (this.settings.mode === 'proxy' && (proxy.loading || proxy.error || !proxy.configured || missingProxyCode)) {
        d.launchHint.textContent = proxy.loading
          ? 'Vérification du serveur LLM sécurisé…'
          : proxy.error
            ? 'Serveur LLM indisponible — utilise le mode Démo.'
            : !proxy.configured
              ? 'Le serveur LLM n’est pas configuré. Ajoute une clé côté serveur ou utilise le mode Démo.'
              : 'Saisis le code d’accès du serveur LLM pour continuer.';
      } else if (roster.length < 2) {
        d.launchHint.innerHTML = 'Il faut au moins 2 héros dans le registre. <button type="button" class="dj-link" data-goto-forge>Forger un héros</button>';
      } else if (heroes.length < 2) {
        d.launchHint.textContent = 'Sélectionne au moins 2 aventuriers pour ouvrir le portail.';
      } else if (missingCustom) {
        d.launchHint.textContent = 'Décris ton anomalie sur-mesure pour continuer.';
      } else if (this.settings.gameMode === 'table') {
        d.launchHint.textContent = `${heroes.length} héros · ${custom ? 'anomalie sur-mesure' : (anomaly ? anomaly.name : 'anomalie')} · table de guilde.`;
      } else {
        d.launchHint.textContent = `${heroes.length} héros · ${custom ? 'anomalie sur-mesure' : (anomaly ? anomaly.name : 'anomalie')} · ${length.name} (${length.scenes} scènes).`;
      }
    }
    if (d.trophyDetails) d.trophyChip?.setAttribute('aria-expanded', d.trophyDetails.open ? 'true' : 'false');
  }

  openTrophyRoom() {
    const d = this.dom;
    if (!d.trophyRoom || !d.trophyDetails) return;
    d.trophyRoom.hidden = false;
    d.trophyDetails.open = true;
    d.trophyChip?.setAttribute('aria-expanded', 'true');
    d.trophyRoom.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Setup ------------------------------------------------------------
  renderSquad() {
    const grid = this.dom.squad;
    if (!grid) return;
    const roster = this.getRoster() || [];
    const ids = new Set(roster.map(h => h.id));
    Array.from(this.selected).forEach(id => { if (!ids.has(id)) this.selected.delete(id); });
    if (this.selected.size === 0 && roster.length >= 2) roster.slice(0, Math.min(3, roster.length)).forEach(h => this.selected.add(h.id));
    grid.innerHTML = '';
    if (!roster.length) {
      grid.innerHTML = '<p class="dj-empty">Aucun héros dans le registre. Forge d’abord un aventurier dans la Forge.</p>';
      this.refreshSquadCounter();
      return;
    }
    roster.forEach(hero => {
      const cls = GAME_DATA.CLASSES[hero.classKey] || {};
      const selected = this.selected.has(hero.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dj-hero ${selected ? 'is-selected' : ''}`;
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      btn.dataset.id = hero.id;
      btn.innerHTML = `
        <span class="dj-hero-avatar"></span>
        <span class="dj-hero-info">
          <strong class="dj-hero-name">${escapeHtml(hero.name || 'Aventurier')}</strong>
          <span class="dj-hero-class" style="--class-color:${cls.color || '#e4bf70'}">${escapeHtml(cls.name || '—')} · ${escapeHtml(cls.role || '')}</span>
          <span class="dj-hero-weak">☠ ${escapeHtml((hero.weakness || 'Kryptonite non renseignée').slice(0, 70))}</span>
        </span>
        <span class="dj-hero-check" aria-hidden="true">✓</span>`;
      const avatar = btn.querySelector('.dj-hero-avatar');
      try { this.renderThumb(hero.appearance, hero.classKey, avatar, 96); } catch (e) { /* ignore */ }
      btn.addEventListener('click', () => this.toggleHero(hero));
      grid.appendChild(btn);
    });
    this.refreshSquadCounter();
  }

  toggleHero(hero) {
    if (this.selected.has(hero.id)) this.selected.delete(hero.id);
    else {
      if (this.selected.size >= 5) { this.toast('Escouade limitée à 5 aventuriers.', 'i-users'); return; }
      this.selected.add(hero.id);
    }
    const card = this.dom.squad.querySelector(`[data-id="${CSS.escape(hero.id)}"]`);
    if (card) {
      const on = this.selected.has(hero.id);
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    this.sound('click');
    this.refreshSquadCounter();
  }

  refreshSquadCounter() {
    if (!this.dom.squadCount) return;
    const count = this.selected.size;
    this.dom.squadCount.textContent = count;
    const roster = this.getRoster() || [];
    const valid = count >= 2 && count <= 5 && roster.length >= 2;
    if (this.dom.start) this.dom.start.disabled = !valid;
    if (this.dom.squadHint) {
      this.dom.squadHint.textContent = roster.length < 2
        ? 'Il faut au moins 2 héros dans le registre pour former une escouade.'
        : count < 2 ? 'Sélectionne au moins 2 aventuriers.'
          : count >= 5 ? 'Escouade complète (5/5).' : `${count}/5 aventuriers — prêt pour le portail.`;
    }
    this.updateLaunchSummary();
  }

  renderAnomalies() {
    const grid = this.dom.monsters;
    if (!grid) return;
    grid.innerHTML = '';
    DUNGEON_ANOMALIES.forEach(anomaly => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dj-monster ${anomaly.id === this.anomaly ? 'is-selected' : ''}`;
      btn.setAttribute('aria-pressed', anomaly.id === this.anomaly ? 'true' : 'false');
      btn.dataset.id = anomaly.id;
      btn.innerHTML = `
        <span class="dj-monster-icon"><svg><use href="#${anomaly.icon}"/></svg></span>
        <strong>${escapeHtml(anomaly.name)}</strong>
        <span>${escapeHtml(anomaly.desc)}</span>`;
      btn.addEventListener('click', () => this.selectAnomaly(anomaly.id));
      grid.appendChild(btn);
    });
    this.syncCustomField();
  }

  selectAnomaly(id) {
    this.anomaly = id;
    this.dom.monsters?.querySelectorAll('.dj-monster').forEach(btn => {
      const on = btn.dataset.id === id;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    this.syncCustomField();
    this.updateLaunchSummary();
    this.sound('click');
  }

  syncCustomField() {
    if (!this.dom.customWrap) return;
    const isCustom = this.anomaly === 'custom';
    this.dom.customWrap.hidden = !isCustom;
    if (isCustom) this.dom.custom?.focus({ preventScroll: true });
  }

  setMode(mode) {
    this.settings.mode = mode;
    if (mode === 'proxy' && (!this.serverLlm || this.serverLlm.error)) this.fetchServerLlmStatus();
    this.syncSettingsUI();
    this.persistSettings();
    this.sound('click');
  }
  setLength(id) { if (!CAMPAIGN_LENGTHS.some(l => l.id === id)) return; this.settings.campaignLength = id; this.syncSettingsUI(); this.persistSettings(); this.sound('click'); }
  setGameMode(mode) { this.settings.gameMode = mode === 'table' ? 'table' : 'solo'; this.syncSettingsUI(); this.persistSettings(); this.sound('click'); }

  syncSettingsUI() {
    const d = this.dom;
    d.modeMock?.classList.toggle('is-active', this.settings.mode === 'mock');
    d.modeProxy?.classList.toggle('is-active', this.settings.mode === 'proxy');
    d.modeLlm?.classList.toggle('is-active', this.settings.mode === 'llm');
    if (d.llmConfig) d.llmConfig.hidden = this.settings.mode !== 'llm';
    if (d.proxyConfig) d.proxyConfig.hidden = this.settings.mode !== 'proxy';
    this.syncProxyUI();
    this.dom.view?.querySelectorAll('.dj-length-btn').forEach(btn => {
      if (btn.dataset.length) btn.classList.toggle('is-active', btn.dataset.length === this.settings.campaignLength);
      if (btn.dataset.gamemode) btn.classList.toggle('is-active', btn.dataset.gamemode === this.settings.gameMode);
    });
    if (d.provider) d.provider.value = this.settings.provider;
    const provider = PROVIDERS[this.settings.provider] || PROVIDERS.openai;
    if (d.model) d.model.placeholder = provider.defaultModel;
    if (d.model && this.settings.model) d.model.value = this.settings.model;
    if (d.apiKey && this.settings.apiKey) d.apiKey.value = this.settings.apiKey;
    if (d.baseUrl) d.baseUrl.placeholder = provider.defaultBase;
    if (d.baseUrl && this.settings.baseUrl) d.baseUrl.value = this.settings.baseUrl;
    if (d.apiKey) {
      d.apiKey.disabled = !provider.needsKey;
      d.apiKey.placeholder = provider.needsKey ? provider.hint : 'Aucune clé requise (Ollama)';
    }
    this.updateLaunchSummary();
  }

  async fetchServerLlmStatus() {
    this.serverLlm = { loading: true, configured: false };
    this.syncProxyUI();
    try {
      const res = await fetch('/api/llm/status', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.serverLlm = { ...data, loading: false, error: false };
    } catch (error) {
      this.serverLlm = { loading: false, error: true, configured: false };
    }
    this.syncProxyUI();
    this.updateLaunchSummary();
  }

  syncProxyUI() {
    const d = this.dom;
    const state = this.serverLlm || { loading: true, configured: false };
    if (d.proxyDot) {
      d.proxyDot.classList.remove('is-ready', 'is-error', 'is-loading');
      d.proxyDot.classList.add(state.loading ? 'is-loading' : (state.configured && !state.error ? 'is-ready' : 'is-error'));
    }
    if (d.proxyStatus) {
      d.proxyStatus.textContent = state.loading
        ? 'Vérification du serveur…'
        : state.error
          ? 'Serveur indisponible'
          : state.configured ? 'Serveur prêt' : 'Serveur non configuré';
    }
    if (d.proxyMeta) {
      if (state.loading) {
        d.proxyMeta.textContent = 'Connexion au service LLM sécurisé…';
      } else if (state.error) {
        d.proxyMeta.textContent = 'Impossible de joindre le service. Le mode Démo reste disponible.';
      } else if (!state.configured) {
        d.proxyMeta.textContent = state.message || 'Ajoute une clé LLM dans les variables du serveur.';
      } else {
        const limit = state.rateLimit && state.rateLimit.perHour ? ` · ${state.rateLimit.perHour} appels/h` : '';
        d.proxyMeta.textContent = `${state.providerLabel || state.provider || 'LLM'} · ${state.model || 'modèle par défaut'}${limit}${state.requiresCode ? ' · code d’accès requis' : ''}`;
      }
    }
    if (d.proxyCodeWrap) d.proxyCodeWrap.hidden = !(state.configured && state.requiresCode && !state.error);
    if (d.proxyCode) {
      if (state.configured && state.requiresCode && !d.proxyCode.value && this.settings.accessCode) d.proxyCode.value = this.settings.accessCode;
      if (!state.requiresCode) d.proxyCode.value = '';
    }
  }

  clearLocalKey() {
    this.settings.apiKey = '';
    if (this.dom.apiKey) this.dom.apiKey.value = '';
    this.persistSettings();
    this.toast('Clé locale effacée du navigateur.', 'i-trash');
  }

  onProviderChange() {
    this.settings.provider = this.dom.provider?.value || 'openai';
    this.settings.model = ''; this.settings.baseUrl = ''; this.settings.apiKey = '';
    if (this.dom.model) this.dom.model.value = '';
    if (this.dom.baseUrl) this.dom.baseUrl.value = '';
    if (this.dom.apiKey) this.dom.apiKey.value = '';
    this.syncSettingsUI();
    this.persistSettings();
  }

  persistSettings() {
    this.settings.model = this.dom.model?.value.trim() || '';
    this.settings.apiKey = this.dom.apiKey?.value.trim() || '';
    this.settings.baseUrl = this.dom.baseUrl?.value.trim() || '';
    if (this.dom.proxyCode) this.settings.accessCode = this.dom.proxyCode.value.trim();
    saveSettings(this.settings);
  }

  lengthScenes() {
    return (CAMPAIGN_LENGTHS.find(l => l.id === this.settings.campaignLength) || CAMPAIGN_LENGTHS[1]).scenes;
  }

  // ---- Trophées ---------------------------------------------------------
  checkTrophies() {
    const newly = this.trophies.evaluate();
    newly.forEach(t => { this.questTrophies.push(t); this.announceTrophy(t); });
    if (newly.length) this.renderTrophies();
    return newly;
  }

  announceTrophy(trophy) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast trophy-toast tier-${trophy.tier}`;
    el.innerHTML = `<svg class="toast-icon"><use href="#${trophy.icon}"/></svg><span><strong>Trophée débloqué</strong>${escapeHtml(trophy.name)}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.classList.add('removing'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, 5200);
  }

  renderTrophies() {
    if (!this.dom.trophies) return;
    const unlocked = this.trophies.data.unlocked;
    const stats = this.trophies.data.stats;
    this.dom.trophies.innerHTML = TROPHIES.map(t => {
      const at = unlocked[t.id];
      const isUnlocked = !!at;
      const progress = !isUnlocked && t.progress ? t.progress(stats) : null;
      return `
        <article class="dj-trophy ${isUnlocked ? 'is-unlocked' : 'is-locked'} tier-${t.tier}">
          <span class="dj-trophy-icon"><svg><use href="#${isUnlocked ? t.icon : 'i-lock'}"/></svg></span>
          <div class="dj-trophy-body">
            <strong>${escapeHtml(t.name)}</strong>
            <p>${escapeHtml(t.desc)}</p>
            <span class="dj-trophy-meta">${TIER_NAMES[t.tier] || t.tier}${progress ? ` · ${progress[0]}/${progress[1]}` : ''}${isUnlocked ? ` · ${dateLabel(at)}` : ''}</span>
          </div>
        </article>`;
    }).join('');
    if (this.dom.trophyCount) this.dom.trophyCount.textContent = `${this.trophies.count()}/${TROPHIES.length}`;
    if (this.dom.trophyBar) this.dom.trophyBar.style.width = `${Math.round((this.trophies.count() / TROPHIES.length) * 100)}%`;
    const chip = document.getElementById('dj-trophy-chip');
    if (chip) chip.textContent = `${this.trophies.count()}/${TROPHIES.length}`;
  }

  renderQuestTrophies() {
    const el = this.dom.questTrophies;
    if (!el) return;
    if (!this.questTrophies.length) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<h4>Trophées de la quête</h4><div class="dj-quest-trophy-list">
      ${this.questTrophies.map(t => `<span class="dj-quest-trophy tier-${t.tier}"><svg><use href="#${t.icon}"/></svg>${escapeHtml(t.name)}</span>`).join('')}
    </div>`;
  }

  // ---- Quête ------------------------------------------------------------
  async startQuest() {
    if (this.busy) return;
    const roster = this.getRoster() || [];
    const squad = roster.filter(h => this.selected.has(h.id));
    if (squad.length < 2) { this.toast('Sélectionne au moins 2 aventuriers.', 'i-users', true); return; }
    if (this.anomaly === 'custom' && !String(this.customAnomaly || '').trim()) {
      this.toast('Décris l’anomalie sur-mesure avant de franchir le portail.', 'i-quill', true);
      this.dom.custom?.focus();
      return;
    }
    if (this.settings.mode === 'proxy') {
      const status = this.serverLlm || {};
      if (status.loading) {
        this.toast('Vérification du serveur LLM sécurisé…', 'i-shield');
        this.fetchServerLlmStatus();
        return;
      }
      if (status.error) {
        this.toast('Serveur LLM indisponible. Utilise le mode Démo ou réessaie plus tard.', 'i-shield', true);
        return;
      }
      if (!status.configured) {
        this.toast('Le serveur LLM n’est pas configuré. Ajoute une clé côté serveur.', 'i-lock', true);
        return;
      }
      if (status.requiresCode && !String(this.settings.accessCode || '').trim()) {
        this.toast('Saisis le code d’accès du serveur LLM.', 'i-lock', true);
        this.dom.proxyCode?.focus();
        return;
      }
    }
    this.persistSettings();
    this.service = new DungeonMasterService(this.settings);
    this.busy = true;
    this.questTrophies = [];
    this.showLoading(true);
    const stats = this.trophies.data.stats;
    stats.started += 1;
    stats.maxSquad = Math.max(stats.maxSquad, squad.length);
    stats.anomalies[this.anomaly] = (stats.anomalies[this.anomaly] || 0) + 1;
    if (this.anomaly === 'custom') stats.customUsed += 1;
    this.trophies.save();
    this.checkTrophies();

    try {
      const { campaign, source } = await this.service.generateCampaign({ squad, anomaly: this.anomaly, customAnomaly: this.customAnomaly, sceneCount: this.lengthScenes() });
      this.campaign = campaign;
      this.campaign.source = source;
      this.cohesion = 50;
      this.soloPlan = {};
      this.soloReactions = {};
      this.talentOptions = mergeTalentOptions(this.campaign, squad, this.anomaly);
      this.campaign.talent_options = this.talentOptions;
      if (this.settings.gameMode === 'table') await this.createRoom();
      this.renderNarration();
      this.showStep('narration');
      this.sound('fanfare');
    } catch (error) {
      console.warn('[Dungeon] LLM failed:', error);
      if (this.settings.mode === 'proxy' && [401, 403, 429, 503].includes(error.status)) {
        this.toast(error.message, 'i-shield', true);
        return;
      }
      this.campaign = buildMockCampaign(squad, this.anomaly, this.customAnomaly, this.lengthScenes());
      this.campaign.source = 'mock';
      this.cohesion = 50;
      this.soloPlan = {};
      this.soloReactions = {};
      this.talentOptions = mergeTalentOptions(this.campaign, squad, this.anomaly);
      this.campaign.talent_options = this.talentOptions;
      if (this.settings.gameMode === 'table') await this.createRoom();
      this.renderNarration();
      this.showStep('narration');
      if (this.dom.fallback) {
        this.dom.fallback.hidden = false;
        const engineName = this.settings.mode === 'proxy' ? 'Le serveur LLM sécurisé' : 'Le Maître du Jeu connecté';
        this.dom.fallback.textContent = `${engineName} n’a pas répondu (${error.message}). Une campagne de secours a été tissée en mode Démo.`;
      }
      this.toast(this.settings.mode === 'proxy' ? 'Serveur LLM indisponible — campagne de secours générée.' : 'LLM indisponible — campagne de secours générée.', 'i-skull', true);
    } finally {
      this.busy = false;
      this.showLoading(false);
    }
  }

  showLoading(active) {
    if (!this.dom.loading) return;
    this.dom.loading.hidden = !active;
    if (active && this.dom.loadingText) {
      this.dom.loadingText.textContent = this.settings.mode === 'llm'
        ? 'Le Maître du Jeu consulte les astres…'
        : this.settings.mode === 'proxy'
          ? 'Le serveur sécurisé tisse le donjon…'
          : 'Le Maître du Jeu tisse le donjon…';
    }
    this.updateLaunchSummary();
  }

  // ---- Carrousel narratif ----------------------------------------------
  renderNarration() {
    const c = (this.room && this.room.campaign) ? this.room.campaign : this.campaign;
    if (!c) return;
    this.campaign = c;
    const length = CAMPAIGN_LENGTHS.find(l => l.id === (this.room ? this.room.length : this.settings.campaignLength)) || CAMPAIGN_LENGTHS[1];
    const wanted = length.scenes;
    const extra = (c.scenes || []).slice(0, Math.max(0, wanted - 1));
    while (1 + extra.length < wanted) extra.push(INTERLUDES[extra.length % INTERLUDES.length]);
    this.timeline = [
      { title: c.dungeon_title, text: c.intro_narrative, kicker: 'Scène 1 — L’incident métaphorique' },
      ...extra.map((scene, i) => ({ title: scene.title, text: scene.text, kicker: `Scène ${i + 2} — ${scene.title}` }))
    ];
    this.sceneIndex = this.room ? Math.min(this.room.sceneIndex || 0, this.timeline.length - 1) : 0;
    this.renderCarousel();
    this.renderTablePanel();
  }

  renderCarousel() {
    const track = this.dom.carouselTrack;
    if (!track) return;
    const joiner = !!(this.room && !this.isHost);
    track.innerHTML = this.timeline.map((scene, slideIndex) => {
      const options = this.sceneChoices(slideIndex);
      const selected = this.reactionAt(slideIndex);
      return `
        <article class="dj-slide" data-scene="${slideIndex}">
          <p class="dj-scene-kicker"><svg><use href="#i-scroll"/></svg> ${escapeHtml(scene.kicker)}</p>
          <h2 class="dj-scene-title">${escapeHtml(scene.title)}</h2>
          <p class="dj-intro">${escapeHtml(scene.text)}</p>
          <div class="dj-reactions">
            <span class="dj-kicker">Ta réplique dans cette scène</span>
            <div class="dj-reaction-list">
              ${options.map(o => `
                <button type="button" class="dj-reaction ${selected === o.id ? 'is-selected' : ''}" data-scene="${slideIndex}" data-reaction="${o.id}">
                  <span>${escapeHtml(o.label)}</span>
                  <small>${o.delta > 0 ? '+' : ''}${o.delta} cohésion</small>
                </button>`).join('')}
            </div>
            <p class="dj-reaction-echo">${selected ? `« ${escapeHtml((options.find(o => o.id === selected) || {}).echo || '')} »` : ''}</p>
          </div>
          <p class="dj-slide-progress">Scène ${slideIndex + 1} / ${this.timeline.length}</p>
        </article>`;
    }).join('');

    track.querySelectorAll('[data-reaction]').forEach(btn => {
      btn.addEventListener('click', () => this.selectReaction(Number(btn.dataset.scene), btn.dataset.reaction));
    });

    if (this.dom.sceneDots) {
      this.dom.sceneDots.innerHTML = this.timeline.map((_, i) => `<button type="button" class="dj-dot ${i === this.sceneIndex ? 'is-on' : ''}" data-dot="${i}" aria-label="Scène ${i + 1}"></button>`).join('');
      this.dom.sceneDots.querySelectorAll('[data-dot]').forEach(dot => dot.addEventListener('click', () => this.goToScene(Number(dot.dataset.dot), true)));
    }
    if (this.dom.sceneProgress) this.dom.sceneProgress.textContent = `Scène ${this.sceneIndex + 1} / ${this.timeline.length}`;
    this.updateCarouselNav(joiner);
    this.scrollCarousel(this.sceneIndex, false);

    const spot = this.dom.spotlights;
    if (spot) {
      spot.innerHTML = (this.campaign.character_spotlights || []).map(s => `
        <article class="dj-spotlight">
          <span class="dj-spotlight-rune">☠</span>
          <div><strong>${escapeHtml(s.character_name)}</strong><p>${escapeHtml(s.challenge)}</p></div>
        </article>`).join('');
    }
  }

  updateCarouselNav(joiner) {
    const d = this.dom;
    const total = this.timeline.length;
    const current = this.reactionAt(this.sceneIndex);
    const chosen = this.timeline.filter((_, i) => this.reactionAt(i)).length;
    if (d.prev) d.prev.hidden = joiner || this.sceneIndex === 0;
    if (d.next) {
      d.next.hidden = joiner;
      const last = this.sceneIndex >= total - 1;
      d.next.innerHTML = `<svg><use href="#i-chevron-right"/></svg> ${last ? 'Passer à l’épreuve' : 'Scène suivante'}`;
      d.next.disabled = !current;
    }
    if (d.navHint) {
      if (joiner) {
        d.navHint.textContent = 'L’hôte fait avancer le récit. Choisis ta réplique pour participer.';
        d.navHint.classList.remove('is-ready');
      } else if (!current) {
        d.navHint.textContent = 'Choisis une réplique ci-dessus pour débloquer la suite.';
        d.navHint.classList.remove('is-ready');
      } else if (chosen < total) {
        d.navHint.textContent = `${chosen}/${total} répliques choisies — encore ${total - chosen} scène${total - chosen > 1 ? 's' : ''} à traverser.`;
        d.navHint.classList.remove('is-ready');
      } else if (this.sceneIndex >= total - 1) {
        d.navHint.textContent = 'Toutes les répliques sont choisies. Le groupe peut affronter l’épreuve.';
        d.navHint.classList.add('is-ready');
      } else {
        d.navHint.textContent = 'Réplique enregistrée. Continue vers la scène suivante.';
        d.navHint.classList.add('is-ready');
      }
    }
  }

  scrollCarousel(index, smooth) {
    const carousel = this.dom.carousel;
    if (!carousel) return;
    const slide = carousel.querySelector(`[data-scene="${index}"]`);
    if (slide) carousel.scrollTo({ left: slide.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
    if (this.dom.sceneProgress) this.dom.sceneProgress.textContent = `Scène ${index + 1} / ${this.timeline.length}`;
    this.dom.sceneDots?.querySelectorAll('[data-dot]').forEach(dot => dot.classList.toggle('is-on', Number(dot.dataset.dot) === index));
  }

  goToScene(index, smooth) {
    if (index < 0 || index >= this.timeline.length) return;
    this.sceneIndex = index;
    this.scrollCarousel(index, smooth);
    this.updateCarouselNav(!!(this.room && !this.isHost));
  }

  sceneChoices(index) {
    const custom = this.campaign && this.campaign.reactions;
    if (Array.isArray(custom) && Array.isArray(custom[index]) && custom[index].length) {
      return custom[index].map((option, i) => ({
        ...option,
        id: option.id || `r${index}-${i}`,
        delta: Number.isFinite(Number(option.delta)) ? Number(option.delta) : 0
      }));
    }
    return sceneOptions(index);
  }

  reactionAt(index) {
    if (this.room) {
      const byScene = (this.room.reactions || {})[this.playerId];
      return byScene && byScene[index] ? byScene[index].optionId : null;
    }
    return this.soloReactions[index] ? this.soloReactions[index].optionId : null;
  }

  async selectReaction(index, optionId) {
    const option = this.sceneChoices(index).find(o => o.id === optionId);
    if (!option) return;
    if (this.room) {
      if (!this.room.reactions) this.room.reactions = {};
      if (!this.room.reactions[this.playerId]) this.room.reactions[this.playerId] = {};
      this.room.reactions[this.playerId][index] = { optionId, at: Date.now() };
      this.renderCarousel();
      this.renderTablePanel();
      try {
        const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/reaction`, { method: 'POST', body: { playerId: this.playerId, sceneIndex: index, optionId } });
        this.room = room;
        this.renderTablePanel();
      } catch (e) { /* ignore */ }
    } else {
      const previous = this.soloReactions[index];
      if (previous) {
        const prev = this.sceneChoices(index).find(o => o.id === previous.optionId);
        if (prev) this.cohesion = clamp(this.cohesion - prev.delta, 0, 100);
      }
      this.soloReactions[index] = { optionId, at: Date.now() };
      this.cohesion = clamp(this.cohesion + option.delta, 0, 100);
      this.renderCarousel();
      this.updateCohesion();
    }
    this.sound('click');
  }

  nextScene() {
    if (!this.timeline.length) return;
    if (!this.reactionAt(this.sceneIndex)) { this.toast('Choisis une réplique pour continuer.', 'i-bolt', true); return; }
    if (this.sceneIndex < this.timeline.length - 1) {
      this.goToScene(this.sceneIndex + 1, true);
      this.sound('click');
      this.syncScene();
      return;
    }
    const missing = this.timeline.findIndex((_, i) => !this.reactionAt(i));
    if (missing !== -1) {
      this.toast(`Il manque une réplique à la scène ${missing + 1}.`, 'i-bolt', true);
      this.goToScene(missing, true);
      return;
    }
    const missingReactions = this.timeline.some((_, i) => !this.reactionAt(i));
    if (missingReactions) return;
    this.goToDilemma();
  }

  prevScene() {
    if (this.sceneIndex > 0) {
      this.goToScene(this.sceneIndex - 1, true);
      this.sound('click');
      this.syncScene();
    }
  }

  async syncScene() {
    if (!this.room || !this.isHost || this.room.phase !== 'narration') return;
    try {
      const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/scene`, { method: 'POST', body: { playerId: this.playerId, sceneIndex: this.sceneIndex } });
      this.room = room;
      this.lastScene = room.sceneIndex;
      this.renderTablePanel();
    } catch (e) { /* ignore */ }
  }

  // ---- Dilemme ----------------------------------------------------------
  async goToDilemma() {
    if (!this.campaign) return;
    if (this.room && this.isHost) {
      if (this.room.phase === 'narration') {
        try {
          const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/phase`, { method: 'POST', body: { playerId: this.playerId, phase: 'answers' } });
          this.room = room;
          this.lastPhase = room.phase;
        } catch (e) { /* ignore */ }
      }
      this.showStep('dilemma');
      this.renderTableDilemma();
      return;
    }
    this.renderSoloDilemma();
    this.showStep('dilemma');
  }

  renderSoloDilemma() {
    const d = this.dom;
    if (d.dilemmaTitle) d.dilemmaTitle.textContent = this.campaign ? this.campaign.dungeon_title : '—';
    if (d.dilemmaKicker) d.dilemmaKicker.innerHTML = `<svg><use href="#i-bolt"/></svg> Dernière scène — l’épreuve &amp; les choix`;
    if (d.table) d.table.hidden = true;
    if (d.tableControls) d.tableControls.hidden = true;
    if (d.dice) d.dice.hidden = true;
    this.resetDilemmaResult();
    if (d.toDebrief) d.toDebrief.hidden = true;
    if (d.rollBtn) d.rollBtn.disabled = true;
    this.soloPlan = {};
    this.renderPlanGroups(this.talentOptions, 'solo');
    this.updateSoloRollState();
    this.updateCohesion();
  }

  resetDilemmaResult() {
    this.dom.dilemma?.classList.remove('is-result');
    if (this.dom.d20) {
      this.dom.d20.textContent = '20';
      this.dom.d20.classList.remove('is-rolling', 'is-success', 'is-fail');
    }
    if (this.dom.diceResult) { this.dom.diceResult.hidden = true; this.dom.diceResult.innerHTML = ''; }
    this.dom.choices?.classList.remove('is-locked');
  }

  renderDilemmaBrief(html) {
    if (this.dom.dilemmaBrief) this.dom.dilemmaBrief.innerHTML = html;
  }

  renderPlanGroups(options, mode) {
    const grid = this.dom.choices;
    if (!grid) return;
    const byHero = {};
    options.forEach(o => {
      if (!byHero[o.hero_id]) byHero[o.hero_id] = { name: o.hero_name, options: [] };
      byHero[o.hero_id].options.push(o);
    });
    const selected = mode === 'solo'
      ? this.selectedSoloOptions()
      : (this.room && this.room.phase === 'vote' ? this.tableVoteSelection : this.tableSelection);
    grid.innerHTML = Object.entries(byHero).map(([heroId, group]) => {
      const picked = group.options.filter(o => selected.includes(o.id)).length;
      return `
      <article class="dj-plan-hero" data-hero="${escapeHtml(heroId)}">
        <header class="dj-plan-hero-head"><strong>${escapeHtml(group.name)}</strong><span>${picked}/3 atouts</span></header>
        <div class="dj-plan-options">
          ${group.options.map(o => `
            <button type="button" class="dj-plan-option ${selected.includes(o.id) ? 'is-selected' : ''}" data-option="${escapeHtml(o.id)}">
              <span class="dj-plan-kind">${o.kind === 'force' ? 'Force' : o.kind === 'potion' ? 'Potion' : o.kind === 'krypto' ? 'Kryptonite' : 'Risque'}</span>
              <span>${escapeHtml(o.label)}</span>
              <small>${o.cohesion_delta > 0 ? '+' : ''}${o.cohesion_delta}</small>
            </button>`).join('')}
        </div>
      </article>`; }).join('');
    grid.querySelectorAll('[data-option]').forEach(btn => {
      btn.addEventListener('click', () => this.togglePlanOption(btn.dataset.option, mode));
    });
  }

  selectedSoloOptions() {
    return Object.values(this.soloPlan).flat();
  }

  togglePlanOption(optionId, mode) {
    const option = this.talentOptions.find(o => o.id === optionId) || (this.room && this.roomOptions().find(o => o.id === optionId));
    if (!option) return;
    if (mode === 'solo') {
      const heroId = option.hero_id;
      const list = this.soloPlan[heroId] || [];
      const idx = list.indexOf(optionId);
      if (idx >= 0) list.splice(idx, 1);
      else {
        if (list.length >= 3) { this.toast('3 atouts maximum par héros.', 'i-users'); return; }
        list.push(optionId);
      }
      this.soloPlan[heroId] = list;
      this.renderPlanGroups(this.talentOptions, 'solo');
      this.updateSoloRollState();
    } else {
      const voting = !!(this.room && this.room.phase === 'vote');
      const list = voting ? this.tableVoteSelection : this.tableSelection;
      const idx = list.indexOf(optionId);
      if (idx >= 0) list.splice(idx, 1);
      else {
        if (list.length >= 3) { this.toast('3 options maximum par joueur.', 'i-users'); return; }
        list.push(optionId);
      }
      this.renderTableDilemma();
    }
    this.sound('click');
  }

  updateSoloRollState() {
    const heroIds = Object.keys(this.soloPlan).filter(id => this.soloPlan[id].length > 0);
    const heroCount = new Set(this.talentOptions.map(o => o.hero_id)).size;
    const ready = heroIds.length === heroCount && heroIds.every(id => this.soloPlan[id].length > 0);
    const picks = this.selectedSoloOptions().length;
    if (this.dom.rollBtn) {
      this.dom.rollBtn.disabled = !ready;
      this.dom.rollBtn.innerHTML = `<svg><use href="#i-dice"/></svg> Lancer le d20`;
    }
    if (this.dom.dice) this.dom.dice.hidden = false;
    if (this.dom.diceResult) this.dom.diceResult.hidden = true;
    if (this.dom.toDebrief) this.dom.toDebrief.hidden = true;
    if (this.dom.rollHint) {
      this.dom.rollHint.textContent = ready
        ? 'Tout le monde est prêt. Le d20 décidera de l’issue (DD 11).'
        : `Choisis 1 à 3 atouts pour chaque héros — ${heroIds.length}/${heroCount} héros prêts.`;
      this.dom.rollHint.classList.toggle('is-ready', ready);
    }
    this.renderDilemmaBrief(`
      <span class="dj-brief-item"><b>${picks}</b><small>atouts choisis</small></span>
      <span class="dj-brief-item"><b>${heroIds.length}/${heroCount}</b><small>héros prêts</small></span>
      <span class="dj-brief-item"><b>DD 11</b><small>seuil de réussite</small></span>`);
  }

  soloPlanOptions() {
    return this.talentOptions.filter(o => (this.soloPlan[o.hero_id] || []).includes(o.id));
  }

  rollD20() {
    if (this.rolling) return;
    if (this.room && this.settings.gameMode === 'table') { this.rollTableD20(); return; }
    this.rolling = true;
    if (this.dom.rollBtn) this.dom.rollBtn.disabled = true;
    if (this.dom.diceResult) this.dom.diceResult.hidden = true;
    if (this.dom.d20) this.dom.d20.classList.add('is-rolling');
    this.sound('diceRoll');
    let ticks = 0;
    const interval = setInterval(() => {
      if (this.dom.d20) this.dom.d20.textContent = String(1 + Math.floor(Math.random() * 20));
      ticks++;
      if (ticks >= 16) { clearInterval(interval); this.finishSoloRoll(); }
    }, 70);
  }

  finishSoloRoll() {
    const plan = this.soloPlanOptions();
    const rawDelta = clamp(plan.reduce((sum, o) => sum + o.cohesion_delta, 0), -25, 25);
    const roll = 1 + Math.floor(Math.random() * 20);
    const success = roll >= 11;
    const delta = success ? rawDelta : Math.round(rawDelta / 2);
    this.cohesion = clamp(50 + delta, 0, 100);
    this.rolling = false;

    const stats = this.trophies.data.stats;
    if (roll === 20) stats.nat20 += 1;
    if (roll === 1) stats.nat1 += 1;
    if (plan.some(o => o.cohesion_delta > 0)) stats.coopChoices += 1;
    if (plan.some(o => o.cohesion_delta < 0) && success) stats.recklessSuccess += 1;
    this.trophies.save();
    this.checkTrophies();

    this.roll = { roll, bonus: 0, total: roll, success, delta, rawDelta };
    this.result = { ...this.roll, optionIds: plan.map(o => o.id), outcomeText: plan.map(o => o.outcome_text).join(' ') };

    if (this.dom.d20) {
      this.dom.d20.textContent = String(roll);
      this.dom.d20.classList.remove('is-rolling', 'is-success', 'is-fail');
      this.dom.d20.classList.add(success ? 'is-success' : 'is-fail');
    }
    if (this.dom.diceResult) {
      this.dom.diceResult.hidden = false;
      const planList = plan.map(o => `<li>${escapeHtml(o.hero_name || '')} — ${escapeHtml(o.label)} <em>${o.cohesion_delta > 0 ? '+' : ''}${o.cohesion_delta}</em></li>`).join('');
      this.dom.diceResult.innerHTML = `
        <div class="dj-roll-line">
          <span class="dj-roll-total ${success ? 'is-success' : 'is-fail'}">${success ? 'RÉUSSITE' : 'ÉCHEC'}</span>
          <span class="dj-roll-detail">d20 ${roll} · DD 11</span>
        </div>
        <p class="dj-outcome">${escapeHtml(this.result.outcomeText)}</p>
        <p class="dj-delta ${delta >= 0 ? 'is-pos' : 'is-neg'}">Cohésion ${delta >= 0 ? '+' : '−'}${Math.abs(delta)}</p>
        <div class="dj-plan-recap"><span class="dj-kicker">Plan retenu</span><ul class="dj-plan-list">${planList}</ul></div>`;
    }
    this.dom.dilemma?.classList.add('is-result');
    if (this.dom.rollHint) {
      this.dom.rollHint.textContent = 'Jet effectué — le débrief miroir ouvre la suite.';
      this.dom.rollHint.classList.add('is-ready');
    }
    if (this.dom.toDebrief) this.dom.toDebrief.hidden = false;
    this.dom.choices?.classList.add('is-locked');
    setTimeout(() => this.dom.diceResult?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    this.updateCohesion();
    this.sound(success ? 'fanfare' : 'click');
  }

  updateCohesion() {
    if (this.dom.cohesionFill) this.dom.cohesionFill.style.width = `${this.cohesion}%`;
    if (this.dom.cohesionVal) this.dom.cohesionVal.textContent = `${this.cohesion}/100`;
    if (this.dom.cohesionState) this.dom.cohesionState.textContent = this.cohesionLabel(this.cohesion);
    if (this.dom.cohesionMeter) this.dom.cohesionMeter.setAttribute('aria-valuenow', String(this.cohesion));
  }

  cohesionLabel(value = this.cohesion) {
    if (value >= 80) return 'Légendaire';
    if (value >= 65) return 'Soudée';
    if (value >= 50) return 'Stable';
    if (value >= 35) return 'Fragilisée';
    return 'Au bord de la rupture';
  }

  // ---- Table ------------------------------------------------------------
  async api(path, options = {}) {
    const res = await fetch(path, { method: options.method || 'GET', headers: { 'Content-Type': 'application/json' }, body: options.body ? JSON.stringify(options.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  heroSnapshot(hero) {
    return { id: hero.id, name: hero.name, classKey: hero.classKey, weakness: hero.weakness || '', potion: hero.potion || '', stats: hero.stats || {} };
  }

  roomSquad() {
    if (this.room && Array.isArray(this.room.squad)) return this.room.squad;
    return (this.getRoster() || []).filter(h => this.selected.has(h.id)).map(h => this.heroSnapshot(h));
  }

  roomOptions() {
    if (this.room && this.room.campaign && Array.isArray(this.room.campaign.talent_options)) return this.room.campaign.talent_options;
    return this.talentOptions;
  }

  myHeroId() {
    if (!this.room) return null;
    const me = this.room.players.find(p => p.id === this.playerId);
    return me ? me.heroId : null;
  }

  async createRoom() {
    if (this.room) return true;
    const squad = this.roomSquad();
    if (!this.campaign || squad.length < 2) return false;
    this.campaign.talent_options = this.talentOptions;
    try {
      const data = await this.api('/api/dungeon/rooms', {
        method: 'POST',
        body: { campaign: this.campaign, squad, anomaly: this.anomaly, length: this.settings.campaignLength, hostHeroId: squad[0].id, hostName: squad[0].name }
      });
      this.room = data.room;
      this.playerId = data.playerId;
      this.roomCode = data.code;
      this.isHost = true;
      this.lastPhase = data.room.phase;
      this.lastScene = data.room.sceneIndex || 0;
      this.answerSubmitted = false;
      this.voteSubmitted = false;
      this.tableSelection = [];
      this.tableVoteSelection = [];
      this.startPolling();
      this.renderTablePanel();
      this.toast(`Table ouverte — code ${data.code}`, 'i-users');
      return true;
    } catch (error) {
      console.warn('[Dungeon] Room creation failed:', error);
      this.toast('Table indisponible — la quête continue en solo.', 'i-skull', true);
      this.settings.gameMode = 'solo';
      this.syncSettingsUI();
      this.persistSettings();
      return false;
    }
  }

  startPolling() { this.stopPolling(); this.pollTimer = setInterval(() => this.pollRoom(), 1500); }
  stopPolling() { if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; } }

  async pollRoom() {
    if (!this.roomCode || this.pollBusy) return;
    this.pollBusy = true;
    try {
      const room = await this.api(`/api/dungeon/rooms/${this.roomCode}`);
      this.applyRoom(room);
    } catch (error) {
      if (String(error.message).match(/404|introuvable|expirée/i)) {
        this.stopPolling();
        this.room = null; this.playerId = null; this.roomCode = null; this.lastPhase = null;
        this.settings.gameMode = 'solo';
        this.syncSettingsUI();
        this.toast('La table a été fermée par l’hôte.', 'i-users', true);
        this.resetQuest();
      }
    } finally {
      this.pollBusy = false;
    }
  }

  applyRoom(room) {
    if (!room) return;
    const prevPhase = this.lastPhase;
    const prevScene = this.lastScene;
    const sceneChanged = room.phase === 'narration' && prevScene !== null && room.sceneIndex !== prevScene;
    this.room = room;
    this.isHost = room.hostId === this.playerId;
    this.lastPhase = room.phase;
    this.lastScene = room.sceneIndex;
    if (room.phase === 'vote' && prevPhase !== 'vote') this.tableVoteSelection = [];
    this.renderTablePanel();

    if (room.phase === 'narration') {
      if (sceneChanged) {
        this.sceneIndex = Math.min(room.sceneIndex || 0, Math.max(0, this.timeline.length - 1));
        this.scrollCarousel(this.sceneIndex, true);
        this.updateCarouselNav(!!(this.room && !this.isHost));
      } else if (prevPhase !== 'narration') {
        if (this.step !== 'narration') { this.renderNarration(); this.showStep('narration'); }
        else { this.renderCarousel(); }
      }
      return;
    }
    if (room.phase === 'debrief' && prevPhase === 'debrief') {
      this.syncPactFromRoom(room);
      return;
    }
    if (prevPhase === room.phase) {
      if (room.phase === 'answers' || room.phase === 'vote') {
        this.renderTableBrief();
        this.updateTableLiveCounts();
      }
      return;
    }
    this.answerSubmitted = !!(room.answers && room.answers[this.playerId]);
    this.voteSubmitted = !!(room.votes && room.votes[this.playerId]);
    if (room.phase === 'answers') { this.tableNote = ''; }
    if (room.phase === 'vote') { this.tableNote = ''; }
    if (room.phase === 'debrief') {
      this.renderDebrief();
      this.renderQuestTrophies();
      this.showStep('debrief');
      this.sound('fanfare');
      this.recordCompletion(room.result ? room.result.cohesion : 50, room.length, 'table');
    } else {
      this.showStep('dilemma');
      this.renderTableDilemma();
    }
  }

  enterRoom(room) {
    this.room = room;
    this.isHost = room.hostId === this.playerId;
    this.lastPhase = room.phase;
    this.lastScene = room.sceneIndex;
    this.talentOptions = room.campaign.talent_options || this.talentOptions;
    this.renderTablePanel();
    if (room.phase === 'narration') {
      this.campaign = room.campaign;
      this.renderNarration();
      this.showStep('narration');
    } else if (room.phase === 'debrief') {
      this.renderDebrief();
      this.renderQuestTrophies();
      this.showStep('debrief');
    } else {
      this.showStep('dilemma');
      this.renderTableDilemma();
    }
  }

  renderTablePanel() {
    const d = this.dom;
    if (!d.table) return;
    if (!this.room) { d.table.hidden = true; return; }
    d.table.hidden = false;
    if (d.tableCode) d.tableCode.textContent = this.room.code;
    const phase = this.room.phase;
    const scene = this.room.sceneIndex || 0;
    if (d.tablePlayers) {
      d.tablePlayers.innerHTML = this.room.players.map(p => {
        let status = 'Prêt';
        if (phase === 'narration') status = this.room.reactions && this.room.reactions[p.id] && this.room.reactions[p.id][scene] ? 'A réagi' : 'Écoute';
        if (phase === 'answers') status = this.room.answers && this.room.answers[p.id] ? 'A répondu' : 'Réfléchit';
        if (phase === 'vote') status = this.room.votes && this.room.votes[p.id] ? 'A voté' : 'Vote…';
        if (phase === 'roll') status = 'Décision prise';
        if (phase === 'debrief') status = 'Quête terminée';
        return `<span class="dj-table-player ${p.id === this.room.hostId ? 'is-host' : ''}">
          <span class="dj-table-player-name">${p.id === this.room.hostId ? '★ ' : ''}${escapeHtml(p.name)}</span>
          <span class="dj-table-player-status">${status}</span>
        </span>`;
      }).join('');
    }
    if (d.tableStatus) {
      const answers = this.room.answersCount || 0;
      const votes = this.room.votesCount || 0;
      const total = this.room.players.length;
      const totalScenes = (CAMPAIGN_LENGTHS.find(l => l.id === this.room.length) || { scenes: 3 }).scenes;
      if (phase === 'narration') {
        const reacted = this.room.players.filter(p => this.room.reactions && this.room.reactions[p.id] && this.room.reactions[p.id][scene]).length;
        d.tableStatus.textContent = `Récit — scène ${scene + 1}/${totalScenes} · ${reacted}/${total} ont réagi. Partage le code ${this.room.code}.`;
      } else if (phase === 'answers') {
        d.tableStatus.textContent = `Réponses individuelles : ${answers}/${total}. Chacun choisit ses atouts. L’hôte ouvrira le vote.`;
      } else if (phase === 'vote') {
        d.tableStatus.textContent = `Vote de groupe : ${votes}/${total}. Chacun soutient les atouts qui comptent.`;
      } else if (phase === 'roll') {
        d.tableStatus.textContent = 'Le plan est constitué. L’hôte lance le dé de la table.';
      } else {
        d.tableStatus.textContent = 'La table a terminé : lisez le débrief ensemble.';
      }
    }
  }

  renderTableBrief() {
    const room = this.room;
    if (!room) return;
    const total = room.players.length;
    if (room.phase === 'answers') {
      this.renderDilemmaBrief(`
        <span class="dj-brief-item"><b>${room.answersCount || 0}/${total}</b><small>réponses envoyées</small></span>
        <span class="dj-brief-item"><b>${this.answerSubmitted ? '✓' : '…'}</b><small>ton statut</small></span>
        <span class="dj-brief-item"><b>DD 11</b><small>seuil de réussite</small></span>`);
    } else if (room.phase === 'vote') {
      this.renderDilemmaBrief(`
        <span class="dj-brief-item"><b>${room.votesCount || 0}/${total}</b><small>votes enregistrés</small></span>
        <span class="dj-brief-item"><b>${this.votePool().length}</b><small>atouts en lice</small></span>
        <span class="dj-brief-item"><b>DD 11</b><small>seuil de réussite</small></span>`);
    } else if (room.phase === 'roll') {
      this.renderDilemmaBrief(`
        <span class="dj-brief-item"><b>${this.serverPlanOptions().length}</b><small>atouts retenus</small></span>
        <span class="dj-brief-item"><b>${total}</b><small>joueurs</small></span>
        <span class="dj-brief-item"><b>DD 11</b><small>seuil de réussite</small></span>`);
    }
  }

  updateTableLiveCounts() {
    const el = this.dom.tableControls;
    if (!el || !this.room) return;
    const total = this.room.players.length;
    el.querySelectorAll('[data-live="answers"]').forEach(s => { s.textContent = `(${this.room.answersCount || 0}/${total})`; });
    el.querySelectorAll('[data-live="votes"]').forEach(s => { s.textContent = `(${this.room.votesCount || 0}/${total})`; });
  }

  renderTableDilemma() {
    const d = this.dom;
    if (!this.room) {
      if (d.dilemmaTitle) d.dilemmaTitle.textContent = this.campaign ? this.campaign.dungeon_title : '—';
      if (d.table) d.table.hidden = true;
      if (d.choices) d.choices.innerHTML = '<p class="dj-empty">Ouverture de la table…</p>';
      if (d.tableControls) { d.tableControls.hidden = false; d.tableControls.innerHTML = '<p class="dj-hint">Création de la table de guilde…</p>'; }
      if (d.dice) d.dice.hidden = true;
      return;
    }
    const room = this.room;
    if (d.dilemmaTitle) d.dilemmaTitle.textContent = room.campaign.dungeon_title;
    if (d.dilemmaKicker) d.dilemmaKicker.innerHTML = `<svg><use href="#i-bolt"/></svg> L’épreuve de la table — ${room.phase === 'answers' ? 'atouts individuels' : room.phase === 'vote' ? 'vote de groupe' : room.phase === 'roll' ? 'jet commun' : 'débrief'}`;
    if (d.table) d.table.hidden = false;
    this.renderTablePanel();
    if (d.dice) d.dice.hidden = room.phase !== 'roll' || !this.isHost;
    if (d.toDebrief) d.toDebrief.hidden = true;
    if (room.phase === 'debrief') return;
    this.renderTableControls();

    if (room.phase === 'answers') this.resetDilemmaResult();
    if (room.phase === 'vote') this.resetDilemmaResult();
    if (d.rollHint) {
      if (room.phase === 'roll') {
        d.rollHint.textContent = this.isHost ? 'Le plan est figé : lance le d20 pour toute la table (DD 11).' : 'L’hôte va lancer le dé pour toute la table…';
        d.rollHint.classList.toggle('is-ready', this.isHost);
      } else {
        d.rollHint.textContent = '';
        d.rollHint.classList.remove('is-ready');
      }
    }

    const myHero = this.myHeroId();
    if (room.phase === 'answers') {
      const own = this.roomOptions().filter(o => o.hero_id === myHero);
      this.renderPlanGroups(own, 'table');
      if (this.answerSubmitted) d.choices?.classList.add('is-locked');
      else d.choices?.classList.remove('is-locked');
      this.renderTableBrief();
    } else if (room.phase === 'vote') {
      const pool = this.votePool();
      this.renderPlanGroups(pool, 'table');
      if (this.voteSubmitted) d.choices?.classList.add('is-locked');
      else d.choices?.classList.remove('is-locked');
      this.renderTableBrief();
    } else if (room.phase === 'roll') {
      const plan = this.serverPlanOptions();
      d.choices.innerHTML = `<div class="dj-final-plan"><span class="dj-kicker">Plan de la table</span>${plan.map(o => `<p>${escapeHtml(o.hero_name)} — ${escapeHtml(o.label)} <em>${o.cohesion_delta > 0 ? '+' : ''}${o.cohesion_delta}</em></p>`).join('')}</div>`;
      d.choices.classList.remove('is-locked');
      if (d.rollBtn) { d.rollBtn.disabled = !this.isHost; d.rollBtn.innerHTML = '<svg><use href="#i-dice"/></svg> Lancer le dé de la table'; }
      this.renderTableBrief();
    }
    this.updateCohesion();
  }

  votePool() {
    if (!this.room) return [];
    const ids = new Set();
    Object.values(this.room.answers || {}).forEach(a => (a.choiceIds || []).forEach(id => ids.add(id)));
    return this.roomOptions().filter(o => ids.has(o.id));
  }

  serverPlanOptions() {
    if (!this.room || !this.room.decision) return [];
    return this.roomOptions().filter(o => (this.room.decision.optionIds || []).includes(o.id));
  }

  renderTableControls() {
    const el = this.dom.tableControls;
    if (!el || !this.room) return;
    const room = this.room;
    if (room.phase === 'debrief') { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    const answers = room.answersCount || 0;
    const votes = room.votesCount || 0;
    const total = room.players.length;
    const leave = this.isHost ? '' : '<button type="button" class="btn btn-quiet" data-table="leave"><svg><use href="#i-arrow-left"/></svg> Quitter la table</button>';
    const recap = !this.isHost ? `<details class="dj-table-recap"><summary>Récap du donjon</summary><p>${escapeHtml(room.campaign.intro_narrative)}</p></details>` : '';

    if (room.phase === 'answers') {
      if (this.answerSubmitted) {
        el.innerHTML = `${recap}<div class="dj-table-phase">Phase 1 — Tes atouts</div>
          <p class="dj-table-done"><svg><use href="#i-check"/></svg> Tes atouts sont envoyés. En attente des autres (${answers}/${total}).</p>
          <div class="dj-table-actions">${this.isHost ? '<button type="button" class="btn btn-gold" data-table="vote-open"><svg><use href="#i-users"/></svg> Ouvrir le vote</button>' : leave}</div>`;
      } else {
        el.innerHTML = `${recap}<div class="dj-table-phase">Phase 1 — Tes atouts</div>
          <p class="dj-hint">Choisis 1 à 3 atouts de ton héros ci-dessus (force, potion, kryptonite). Tu peux en cocher plusieurs.</p>
          <textarea id="dj-table-note" class="dj-table-note" rows="2" maxlength="400" placeholder="Pourquoi ces atouts ? (optionnel)…">${escapeHtml(this.tableNote || '')}</textarea>
          <div class="dj-table-actions">
            <button type="button" class="btn btn-gold" data-table="answer" disabled><svg><use href="#i-check"/></svg> Envoyer mes atouts</button>
            ${this.isHost ? `<button type="button" class="btn btn-quiet" data-table="vote-open"><svg><use href="#i-users"/></svg> Passer au vote <span class="dj-live-count" data-live="answers">(${answers}/${total})</span></button>` : leave}
          </div>`;
      }
    } else if (room.phase === 'vote') {
      if (this.voteSubmitted) {
        el.innerHTML = `${recap}<div class="dj-table-phase">Phase 2 — Vote de groupe</div>
          <p class="dj-table-done"><svg><use href="#i-check"/></svg> Ton vote est enregistré (${votes}/${total}).</p>
          <div class="dj-table-actions">${this.isHost ? '<button type="button" class="btn btn-gold" data-table="vote-close"><svg><use href="#i-check"/></svg> Clore le vote <span class="dj-live-count" data-live="votes">(${votes}/${total})</span></button>' : leave}</div>`;
      } else {
        el.innerHTML = `${recap}<div class="dj-table-phase">Phase 2 — Vote de groupe</div>
          <p class="dj-hint">Sélectionne 1 à 3 atouts proposés par la table. Les plus soutenus formeront le plan final (${votes}/${total} votes).</p>
          <div class="dj-table-actions">
            <button type="button" class="btn btn-gold" data-table="vote" disabled><svg><use href="#i-check"/></svg> Voter pour ces atouts</button>
            ${this.isHost ? '<button type="button" class="btn btn-quiet" data-table="vote-close"><svg><use href="#i-check"/></svg> Clore le vote <span class="dj-live-count" data-live="votes">(${votes}/${total})</span></button>' : leave}
          </div>`;
      }
    } else if (room.phase === 'roll') {
      if (this.isHost) {
        el.innerHTML = `${recap}<div class="dj-table-phase">Phase 3 — Le jet de la table</div>
          <p class="dj-hint">Le plan est affiché ci-dessus. Lance le d20 : le résultat vaut pour tout le groupe.</p>`;
      } else {
        el.innerHTML = `${recap}<div class="dj-table-phase">Phase 3 — Le jet de la table</div>
          <p class="dj-table-done">L’hôte va lancer le dé pour toute la table…</p>${leave ? `<div class="dj-table-actions">${leave}</div>` : ''}`;
      }
    }

    el.querySelectorAll('[data-table]').forEach(btn => btn.addEventListener('click', () => this.handleTableAction(btn.dataset.table)));
    const noteEl = el.querySelector('#dj-table-note');
    if (noteEl) noteEl.addEventListener('input', () => { this.tableNote = noteEl.value; });
    const submitAnswer = el.querySelector('[data-table="answer"]');
    if (submitAnswer) submitAnswer.disabled = this.tableSelection.length === 0;
    const submitVote = el.querySelector('[data-table="vote"]');
    if (submitVote) submitVote.disabled = this.tableVoteSelection.length === 0;
  }

  async handleTableAction(action) {
    try {
      if (action === 'answer') {
        if (!this.tableSelection.length) { this.toast('Choisis au moins un atout.', 'i-bolt', true); return; }
        const note = document.getElementById('dj-table-note')?.value || '';
        const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/answer`, { method: 'POST', body: { playerId: this.playerId, choiceIds: this.tableSelection, note } });
        this.answerSubmitted = true;
        this.tableNote = '';
        this.applyRoom(room);
        this.renderTableDilemma();
      } else if (action === 'vote') {
        if (!this.tableVoteSelection.length) { this.toast('Choisis au moins un atout à soutenir.', 'i-bolt', true); return; }
        const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/vote`, { method: 'POST', body: { playerId: this.playerId, choiceIds: this.tableVoteSelection } });
        this.voteSubmitted = true;
        this.applyRoom(room);
        this.renderTableDilemma();
      } else if (action === 'vote-open') {
        const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/phase`, { method: 'POST', body: { playerId: this.playerId, phase: 'vote' } });
        this.tableVoteSelection = [];
        this.applyRoom(room);
      } else if (action === 'vote-close') {
        const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/vote-close`, { method: 'POST', body: { playerId: this.playerId } });
        this.applyRoom(room);
      } else if (action === 'roll') {
        this.rollTableD20();
      } else if (action === 'leave') {
        await this.leaveTable();
      }
    } catch (error) {
      this.toast(error.message || 'Action impossible', 'i-skull', true);
    }
  }

  async leaveTable() {
    try {
      if (this.roomCode && this.playerId) await this.api(`/api/dungeon/rooms/${this.roomCode}/leave`, { method: 'POST', body: { playerId: this.playerId } });
    } catch (e) { /* ignore */ }
    this.stopPolling();
    this.room = null; this.playerId = null; this.roomCode = null; this.lastPhase = null;
    this.settings.gameMode = 'solo';
    this.syncSettingsUI();
    this.resetQuest();
    this.toast('Tu as quitté la table.', 'i-users');
  }

  async closeTableIfHost() {
    if (this.roomCode && this.isHost) {
      try { await this.api(`/api/dungeon/rooms/${this.roomCode}`, { method: 'DELETE', body: { playerId: this.playerId } }); } catch (e) { /* ignore */ }
    }
    this.stopPolling();
    this.room = null; this.playerId = null; this.roomCode = null; this.lastPhase = null;
  }

  rollTableD20() {
    if (this.rolling) return;
    this.rolling = true;
    if (this.dom.rollBtn) this.dom.rollBtn.disabled = true;
    if (this.dom.d20) this.dom.d20.classList.add('is-rolling');
    this.sound('diceRoll');
    let ticks = 0;
    const interval = setInterval(() => {
      if (this.dom.d20) this.dom.d20.textContent = String(1 + Math.floor(Math.random() * 20));
      ticks++;
      if (ticks >= 16) { clearInterval(interval); this.finishTableRoll(); }
    }, 70);
  }

  async finishTableRoll() {
    const roll = 1 + Math.floor(Math.random() * 20);
    this.rolling = false;
    if (this.dom.d20) { this.dom.d20.textContent = String(roll); this.dom.d20.classList.remove('is-rolling'); }
    try {
      const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/roll`, { method: 'POST', body: { playerId: this.playerId, roll } });
      this.applyRoom(room);
    } catch (error) {
      this.toast(error.message || 'Le jet a échoué.', 'i-skull', true);
    }
  }

  // ---- Rejoindre --------------------------------------------------------
  maybePrefillJoin() {
    try {
      const code = new URLSearchParams(location.search).get('join');
      if (code && this.dom.joinCode) {
        this.dom.joinCode.value = code.toUpperCase();
        this.setSetupPath('join');
        setTimeout(() => {
          document.querySelector('button[data-view="dungeon"]')?.click();
          this.checkJoinCode();
        }, 450);
      }
    } catch (e) { /* ignore */ }
  }

  async checkJoinCode() {
    const code = (this.dom.joinCode?.value || '').trim().toUpperCase();
    if (!code) return;
    if (this.dom.joinStatus) this.dom.joinStatus.textContent = 'Recherche de la table…';
    try {
      const room = await this.api(`/api/dungeon/rooms/${code}`);
      this.pendingRoom = room;
      this.anomaly = room.anomaly || this.anomaly;
      if (this.dom.joinPanel) this.dom.joinPanel.hidden = false;
      if (this.dom.joinTitle) this.dom.joinTitle.textContent = `${room.campaign.dungeon_title} — ${room.players.length} joueur(s) à table`;
      const free = (room.squad || []).filter(hero => !room.players.some(p => p.heroId === (hero.id || hero.name)));
      if (this.dom.joinHero) this.dom.joinHero.innerHTML = free.map(hero => `<option value="${escapeHtml(hero.id || hero.name)}">${escapeHtml(hero.name)} — ${escapeHtml((GAME_DATA.CLASSES[hero.classKey] || {}).name || '')}</option>`).join('');
      if (this.dom.joinStatus) this.dom.joinStatus.textContent = free.length ? 'Choisis ton personnage et rejoins la table.' : 'Tous les personnages sont déjà incarnés.';
      if (this.dom.joinConfirm) this.dom.joinConfirm.disabled = free.length === 0;
    } catch (error) {
      this.pendingRoom = null;
      if (this.dom.joinPanel) this.dom.joinPanel.hidden = true;
      if (this.dom.joinStatus) this.dom.joinStatus.textContent = 'Table introuvable ou code incorrect.';
    }
  }

  async confirmJoin() {
    if (!this.pendingRoom) return;
    const heroId = this.dom.joinHero?.value;
    if (!heroId) { this.toast('Choisis un personnage libre.', 'i-users', true); return; }
    try {
      const data = await this.api(`/api/dungeon/rooms/${this.pendingRoom.code}/join`, { method: 'POST', body: { heroId, playerName: '' } });
      this.room = data.room;
      this.playerId = data.playerId;
      this.roomCode = data.room.code;
      this.isHost = false;
      this.lastPhase = null;
      this.lastScene = null;
      this.answerSubmitted = false;
      this.voteSubmitted = false;
      this.tableSelection = [];
      this.tableVoteSelection = [];
      this.campaign = data.room.campaign;
      this.anomaly = data.room.anomaly || this.anomaly;
      this.settings.gameMode = 'table';
      this.settings.campaignLength = data.room.length || this.settings.campaignLength;
      this.talentOptions = data.room.campaign.talent_options || [];
      this.syncSettingsUI();
      this.persistSettings();
      this.startPolling();
      this.enterRoom(data.room);
      this.toast(`Bienvenue à la table ${data.room.code}`, 'i-users');
    } catch (error) {
      this.toast(error.message || 'Impossible de rejoindre la table.', 'i-skull', true);
    }
  }

  copyTableLink() {
    if (!this.roomCode) return;
    const url = `${location.origin}${location.pathname}?join=${this.roomCode}`;
    navigator.clipboard.writeText(url).then(() => this.toast('Lien de table copié', 'i-copy')).catch(() => this.toast(url, 'i-copy'));
  }

  // ---- Débrief ----------------------------------------------------------
  recordCompletion(cohesion, length, source) {
    const stats = this.trophies.data.stats;
    stats.completed += 1;
    stats.maxCohesion = Math.max(stats.maxCohesion, cohesion);
    stats.minCohesion = Math.min(stats.minCohesion, cohesion);
    if (length) stats.lengths[length] = true;
    if ((this.settings.mode === 'llm' || this.settings.mode === 'proxy') && source === 'llm') stats.llmCompleted += 1;
    if (length === 'epic') stats.epicCompleted += 1;
    this.trophies.save();
    this.checkTrophies();
  }

  goToDebrief() {
    const plan = this.soloPlanOptions();
    if (!plan.length || !this.roll) return;
    this.recordCompletion(this.cohesion, this.settings.campaignLength, this.campaign.source);
    this.renderDebrief();
    this.renderQuestTrophies();
    this.showStep('debrief');
    this.sound('fanfare');
  }

  debriefData() {
    if (this.room && this.room.phase === 'debrief') {
      const campaign = this.room.campaign;
      const result = this.room.result || { roll: 0, bonus: 0, total: 0, success: false, delta: 0, cohesion: 50, optionIds: [] };
      const plan = campaign.talent_options ? campaign.talent_options.filter(o => (this.room.decision?.optionIds || []).includes(o.id)) : [];
      return { campaign, result, plan, cohesion: result.cohesion, table: true };
    }
    return { campaign: this.campaign, result: this.roll, plan: this.soloPlanOptions(), cohesion: this.cohesion, table: false };
  }

  renderDebrief() {
    const data = this.debriefData();
    const { campaign: c, plan, result, cohesion } = data;
    if (!c || !plan.length) return;

    if (this.dom.debriefSummary) {
      const squadSize = data.table && this.room ? this.room.players.length : this.selected.size;
      this.dom.debriefSummary.innerHTML = `
        <div class="dj-summary-outcome ${result.success ? 'is-success' : 'is-fail'}">
          <span class="dj-summary-icon"><svg><use href="#i-${result.success ? 'crown' : 'skull'}"/></svg></span>
          <div class="dj-summary-copy">
            <span class="dj-kicker">Débrief de la quête</span>
            <strong>${result.success ? 'Le groupe a tenu' : 'Le donjon a gagné'}</strong>
            <small>d20 ${result.roll} · DD 11 · ${result.success ? 'réussite' : 'échec'}</small>
          </div>
        </div>
        <div class="dj-summary-stats">
          <span><b>${cohesion}</b><small>cohésion /100</small></span>
          <span><b>${plan.length}</b><small>atouts mobilisés</small></span>
          <span><b>${squadSize}</b><small>aventuriers</small></span>
        </div>`;
    }

    if (this.dom.result) {
      const aiDebrief = c.debrief && typeof c.debrief === 'object' ? c.debrief : {};
      const analysis = (result.success ? aiDebrief.success : aiDebrief.failure) || this.analysisText(plan, result.success);
      const profiles = this.profileCards(data.table, aiDebrief);
      const planList = plan.map(o => `<li><strong>${escapeHtml(o.hero_name || '')}</strong> — ${escapeHtml(o.label)} <em>${o.cohesion_delta > 0 ? '+' : ''}${o.cohesion_delta}</em></li>`).join('');
      this.dom.result.innerHTML = `
        <div class="dj-debrief-head">
          <span class="dj-debrief-rune">✦</span>
          <div><h3>${escapeHtml(c.dungeon_title)}</h3><p>${data.table ? 'La table a assemblé son plan à partir des talents de chacun.' : 'Ton escouade a assemblé un plan à partir de ses forces et faiblesses.'}</p></div>
        </div>
        <div class="dj-debrief-grid">
          <div class="dj-debrief-block dj-debrief-block--wide">
            <span class="dj-kicker">Le plan adopté</span>
            <ul class="dj-plan-list">${planList}</ul>
          </div>
          <div class="dj-debrief-block">
            <span class="dj-kicker">Le jet</span>
            <p>d20 ${result.roll} = <strong>${result.total}</strong> — ${result.success ? 'réussite' : 'échec'} (DD 11)</p>
          </div>
          <div class="dj-debrief-block">
            <span class="dj-kicker">Cohésion</span>
            <p><strong>${cohesion}/100</strong> — ${this.cohesionLabel(cohesion)}</p>
          </div>
        </div>
        <div class="dj-analysis"><span class="dj-kicker">Lecture du Maître du Jeu</span><p>${escapeHtml(analysis)}</p></div>
        ${data.table ? this.renderTally() : ''}
        <div class="dj-profiles"><span class="dj-kicker">Lecture des profils</span><div class="dj-profile-grid">${profiles}</div></div>
        ${this.renderReactionsRecap(data.table)}`;
    }

    if (this.dom.mirror) {
      const aiDebrief = c.debrief && typeof c.debrief === 'object' ? c.debrief : {};
      const defaultQuestions = [
        c.real_world_agreement,
        'Comment transformez-vous ce plan en règle de fonctionnement dès demain ?',
        'Qui s’engage sur quelle action concrète, et quand faites-vous le point ?'
      ].filter(Boolean);
      const aiQuestions = Array.isArray(aiDebrief.mirror_questions) ? aiDebrief.mirror_questions : [];
      const questions = [...new Set([...aiQuestions, ...defaultQuestions].map(q => String(q || '').trim()).filter(Boolean))].slice(0, 3);
      this.dom.mirror.innerHTML = `<h4>La Question Miroir</h4>
        <p class="dj-mirror-intro">Le Maître du Jeu retire son masque : ce que vous venez de vivre en jeu, comment le transférez-vous dans votre vrai projet ?</p>
        <ol class="dj-questions">${questions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}</ol>`;
    }

    if (this.dom.pact) {
      const shared = data.table && this.room ? (this.room.pact || '') : '';
      this.dom.pact.value = shared || this.buildPactTemplate();
      this.updatePactStatus(shared ? 'Pacte partagé' : 'Modèle à compléter');
    }
  }

  analysisText(plan, success) {
    const hasPotion = plan.some(o => o.kind === 'potion');
    const hasRisk = plan.some(o => o.cohesion_delta < 0);
    const total = plan.reduce((s, o) => s + o.cohesion_delta, 0);
    if (hasRisk && !success) return 'Le plan a laissé une kryptonite décider, et le donjon l’a senti. Le groupe devra réparer la confiance avant de réutiliser cette carte.';
    if (hasRisk) return 'L’audace a payé, mais une kryptonite a pris le volant. Notez ce qui a été gagné et ce qui a été sacrifié : cette carte ne se rejoue pas toujours.';
    if (hasPotion && success) return 'Le plan mobilise les forces ET les potions : chacun a apporté quelque chose, et le groupe a transformé la friction en méthode. C’est exactement ce qui manque dans les vraies réunions.';
    if (hasPotion) return 'La potion était là, mais l’exécution a vacillé. Le cadre doit être plus simple et plus court pour tenir sous pression.';
    if (total >= 20) return 'Le plan est solide : les talents se complètent et le groupe avance sans écraser personne.';
    return 'Le plan repose sur les forces individuelles ; il manque encore un relais collectif pour que la cohésion tienne dans la durée.';
  }

  profileCards(table, debrief = {}) {
    let profiles = [];
    if (table && this.room) {
      profiles = this.room.players.map(p => {
        const hero = (this.room.squad || []).find(h => (h.id || h.name) === p.heroId) || p;
        return {
          name: p.name, heroId: p.heroId, classKey: hero.classKey || p.classKey, weakness: hero.weakness || '', potion: hero.potion || '', stats: hero.stats || {},
          answer: this.room.answers[p.id], vote: this.room.votes[p.id]
        };
      });
    } else {
      profiles = (this.getRoster() || []).filter(h => this.selected.has(h.id)).map(h => ({ name: h.name, classKey: h.classKey, weakness: h.weakness, potion: h.potion, stats: h.stats, heroId: h.id }));
    }
    if (!profiles.length) return '<p class="dj-empty">Aucun profil.</p>';
    const options = table && this.room ? (this.room.campaign.talent_options || []) : this.talentOptions;
    const questionByHero = new Map();
    (Array.isArray(debrief.profile_questions) ? debrief.profile_questions : []).forEach(item => {
      if (item.hero_id) questionByHero.set(item.hero_id, item.question);
      if (item.hero_name) questionByHero.set(`name:${String(item.hero_name).toLowerCase()}`, item.question);
    });
    return profiles.map(profile => {
      const cls = GAME_DATA.CLASSES[profile.classKey] || {};
      const stat = dominantStat(profile.stats || {});
      const weakness = (profile.weakness || '').trim() || 'une kryptonite encore tacite';
      const extras = [];
      if (profile.answer) {
        const labels = (profile.answer.choiceIds || []).map(id => options.find(o => o.id === id)).filter(Boolean);
        extras.push(`Ses atouts : ${labels.map(o => escapeHtml(o.label)).join(' · ') || '—'}`);
        if (profile.answer.note) extras.push(`Sa note : « ${escapeHtml(profile.answer.note)} »`);
      } else if (!table) {
        const ids = this.soloPlan[profile.heroId] || [];
        const labels = options.filter(o => ids.includes(o.id));
        if (labels.length) extras.push(`Ses atouts : ${labels.map(o => escapeHtml(o.label)).join(' · ')}`);
      }
      if (profile.vote) {
        const labels = (profile.vote.choiceIds || []).map(id => options.find(o => o.id === id)).filter(Boolean);
        extras.push(`Son vote : ${labels.map(o => escapeHtml(o.label)).join(' · ') || '—'}`);
      }
      return `<article class="dj-profile">
        <header><strong>${escapeHtml(profile.name || 'Aventurier')}</strong><span style="--class-color:${cls.color || '#e4bf70'}">${escapeHtml(cls.name || '')} · ${escapeHtml(cls.role || '')}</span></header>
        <p class="dj-profile-force">Force dominante : <b>${escapeHtml(stat.label)} ${stat.value}/5</b></p>
        <p class="dj-profile-weak">Kryptonite : « ${escapeHtml(weakness)} »</p>
        ${extras.map(e => `<p class="dj-profile-extra">${e}</p>`).join('')}
        <p class="dj-profile-q">${escapeHtml(
          questionByHero.get(profile.heroId) ||
          questionByHero.get(`name:${String(profile.name || '').toLowerCase()}`) ||
          `Miroir : comment ${(profile.name || 'cette personne').split(' ')[0]} transforme-t-il/elle « ${weakness} » en levier ?`
        )}</p>
      </article>`;
    }).join('');
  }

  renderReactionsRecap(table) {
    if (table && this.room) {
      const blocks = this.room.players.map(p => {
        const byScene = (this.room.reactions || {})[p.id] || {};
        const items = Object.keys(byScene).sort((a, b) => a - b).map(idx => {
          const option = this.sceneChoices(Number(idx)).find(o => o.id === byScene[idx].optionId);
          return `<li>Scène ${Number(idx) + 1} — ${escapeHtml(option ? option.label : '—')}</li>`;
        }).join('');
        return items ? `<div class="dj-reaction-recap"><strong>${escapeHtml(p.name)}</strong><ul>${items}</ul></div>` : '';
      }).join('');
      return blocks ? `<div class="dj-reactions-recap"><span class="dj-kicker">Répliques de la traversée</span>${blocks}</div>` : '';
    }
    const entries = Object.keys(this.soloReactions || {}).sort((a, b) => a - b);
    if (!entries.length) return '';
    return `<div class="dj-reactions-recap"><span class="dj-kicker">Tes répliques de la traversée</span><ul>
      ${entries.map(idx => {
        const option = this.sceneChoices(Number(idx)).find(o => o.id === this.soloReactions[idx].optionId);
        return `<li>Scène ${Number(idx) + 1} — ${escapeHtml(option ? option.label : '—')}</li>`;
      }).join('')}
    </ul></div>`;
  }

  renderTally() {
    if (!this.room || !this.room.decision) return '';
    const counts = this.room.decision.counts || {};
    const options = this.roomOptions();
    const lines = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => {
      const o = options.find(x => x.id === id);
      return `<li><strong>${escapeHtml(o ? o.hero_name : id)}</strong> — ${escapeHtml(o ? o.label : '')} : ${n} vote(s)</li>`;
    }).join('');
    return `<div class="dj-tally"><span class="dj-kicker">Vote de la table</span><ul>${lines}</ul></div>`;
  }

  buildPactTemplate() {
    const data = this.debriefData();
    const c = data.campaign;
    if (!c) return '';
    const table = data.table;
    const squad = table && this.room
      ? this.room.players.map(p => p.name).join(', ')
      : (this.getRoster() || []).filter(h => this.selected.has(h.id)).map(h => h.name).join(', ');
    const anomaly = DUNGEON_ANOMALIES.find(a => a.id === (table ? this.room.anomaly : this.anomaly));
    const focus = c.debrief && c.debrief.pact_focus ? String(c.debrief.pact_focus).trim() : '';
    return [
      `# Pacte d’Équipe — ${c.dungeon_title}`,
      '',
      `**Date** : ${todayLabel()}  `,
      `**Escouade** : ${squad || '—'}  `,
      `**Anomalie traversée** : ${anomaly ? anomaly.name : '—'}`,
      '',
      '## Ce que nous emportons du donjon',
      ...(focus ? [`- ${focus}`, '- '] : ['- ']),
      '',
      '## Nos 3 règles d’or',
      '1. ',
      '2. ',
      '3. ',
      '',
      '## Signaux d’alerte',
      '- ',
      '',
      '## Point de suivi',
      '- Qui : ',
      '- Quand : ',
      '',
      '_Pacte à compléter ensemble._',
      ''
    ].join('\n');
  }

  currentPactText() {
    const value = this.dom.pact ? this.dom.pact.value : '';
    return value && value.trim() ? value : this.buildPactTemplate();
  }

  onPactInput() {
    if (!this.room) { this.updatePactStatus('Modèle local'); return; }
    this.updatePactStatus('Enregistrement…');
    clearTimeout(this._pactTimer);
    this._pactTimer = setTimeout(() => this.savePact(), 700);
  }

  async savePact() {
    if (!this.room || !this.roomCode) return;
    try {
      const room = await this.api(`/api/dungeon/rooms/${this.roomCode}/pact`, {
        method: 'POST',
        body: { playerId: this.playerId, text: this.dom.pact?.value || '' }
      });
      this.room = room;
      this.updatePactStatus('Pacte partagé — enregistré');
    } catch (e) {
      this.updatePactStatus('Non enregistré');
    }
  }

  syncPactFromRoom(room) {
    if (!room || !room.pact || !this.dom.pact) return;
    if (document.activeElement === this.dom.pact) return;
    if (this.dom.pact.value !== room.pact) this.dom.pact.value = room.pact;
    this.updatePactStatus('Pacte partagé');
  }

  updatePactStatus(text) {
    if (this.dom.pactStatus) this.dom.pactStatus.textContent = text || '';
  }

  resetPactTemplate() {
    if (!this.dom.pact) return;
    this.dom.pact.value = this.buildPactTemplate();
    this.updatePactStatus(this.room ? 'Modèle réinitialisé — enregistrement…' : 'Modèle réinitialisé');
    if (this.room) {
      clearTimeout(this._pactTimer);
      this._pactTimer = setTimeout(() => this.savePact(), 400);
    }
  }

  copyPact() {
    const text = this.currentPactText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => this.toast('Pacte copié en Markdown', 'i-copy')).catch(() => this.toast('Impossible de copier le pacte', 'i-trash', true));
  }

  downloadPact() {
    const text = this.currentPactText();
    if (!text) return;
    this.trophies.data.stats.pacts += 1;
    this.trophies.save();
    this.checkTrophies();
    this.renderQuestTrophies();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `pacte-equipe-${date}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast('Pacte d’Équipe gravé !', 'i-download');
  }

  showStep(step) {
    this.step = step;
    const map = { setup: this.dom.setup, narration: this.dom.narration, dilemma: this.dom.dilemma, debrief: this.dom.debrief };
    Object.entries(map).forEach(([key, el]) => { if (el) el.hidden = key !== step; });
    if (this.dom.stepLabel) this.dom.stepLabel.textContent = { setup: 'Portail', narration: 'Récit', dilemma: 'L’épreuve', debrief: 'Le pacte' }[step] || '';
    const order = ['setup', 'narration', 'dilemma', 'debrief'];
    const idx = order.indexOf(step);
    this.dom.view?.querySelectorAll('[data-step-dot]').forEach(el => {
      const i = order.indexOf(el.dataset.stepDot);
      const active = i === idx;
      el.classList.toggle('is-active', active);
      el.classList.toggle('is-done', i < idx);
      if (active) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    if (this.dom.fallback) this.dom.fallback.hidden = true;
    if (this.dom.trophyRoom) this.dom.trophyRoom.hidden = !(step === 'setup' || step === 'debrief');
    if (this.dom.table) this.dom.table.hidden = !this.room || step === 'setup';
    if (step === 'setup' || step === 'debrief') this.renderTrophies();
    if (step === 'setup') this.updateLaunchSummary();
    this.dom.view?.classList.toggle('has-launch', step === 'setup' && this.setupPath === 'create');
    if (step !== 'setup') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async exitToSetup() {
    await this.closeTableIfHost();
    this.resetQuest();
    this.showStep('setup');
    setTimeout(() => this.dom.monsters?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  }

  resetQuest() {
    this.stopPolling();
    this.room = null; this.playerId = null; this.roomCode = null; this.lastPhase = null; this.lastScene = null;
    this.campaign = null;
    this.timeline = [];
    this.sceneIndex = 0;
    this.roll = null;
    this.result = null;
    this.cohesion = 50;
    this.questTrophies = [];
    this.answerSubmitted = false;
    this.voteSubmitted = false;
    this.soloPlan = {};
    this.soloReactions = {};
    this.tableSelection = [];
    this.tableVoteSelection = [];
    this.tableNote = '';
    this.showStep('setup');
    this.renderSquad();
  }
}
