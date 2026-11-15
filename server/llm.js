// Aetheria — proxy LLM côté serveur.
// La clé du fournisseur reste exclusivement dans les variables d'environnement.
// Le navigateur n'envoie que les données de la campagne, jamais de secret.

import { timingSafeEqual } from 'node:crypto';

const SYSTEM_PROMPT = `Tu es le Maître du Jeu d'un jeu de rôle d'équipe bienveillant et tactique.
Ton rôle est de tester la cohésion d'un groupe en transformant leurs modes de fonctionnement réels en énigmes de donjon.
Tu reçois la composition de l'équipe (noms, classes, kryptonites, potions), la friction et le nombre de scènes.

Règles de narration :
- Transforme la friction humaine en un piège, un monstre ou une malédiction fantastique.
- Ne blâme personne : valorise la complémentarité des profils.
- Force l'utilisation des potions de réanimation des fiches pour désamorcer la crise.
- Reste percutant, immersif (dark fantasy / aventure épique).
- Chaque scène fait 3 à 4 phrases, sans répéter l'intro. L'intro fait 4 à 6 phrases.
- Réponds en JSON strict et compact, sans texte avant ou après, et sans saut de ligne littéral dans les chaînes.

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
- debrief : analyse succes et échec distinctes, ancrées dans les profils et l'anomalie ; questions miroir spécifiques ; une question de profil par héros ; pact_focus actionnable.
- Aucun texte avant ou après le JSON.`;

const PROVIDERS = {
  openai: { label: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', needsKey: true },
  openrouter: { label: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', needsKey: true },
  anthropic: { label: 'Anthropic', base: 'https://api.anthropic.com/v1', model: 'claude-3-5-haiku-latest', needsKey: true },
  ollama: { label: 'Ollama', base: 'http://localhost:11434', model: 'llama3.1', needsKey: false }
};

const CLASSES = {
  paladin: { name: 'Paladin', role: 'Le Bâtisseur' },
  ranger: { name: 'Rôdeur', role: 'L’Éclaireur' },
  bard: { name: 'Barde', role: 'L’Idéateur' },
  alchemist: { name: 'Alchimiste', role: 'Le Finisseur' }
};

const ANOMALIES = {
  golem: { name: 'Le Golem du Porteur Solitaire', desc: 'Un membre fait tout en solo, se fatigue et finit frustré.' },
  spectre: { name: 'Le Spectre du Brouillard', desc: 'Manque de clarté, timidité, personnes paumées qui n’osent pas demander.' },
  hydre: { name: 'L’Hydre du Débat Infini', desc: 'Divergence de vision, dispersion, aucune décision tranchée.' },
  custom: { name: 'Anomalie sur-mesure', desc: 'Friction décrite par l’équipe.' }
};

const STAT_LABELS = { social: 'Mana Social', speed: 'Initiative', channel: 'Canal', chaos: 'Pivots' };

const buckets = new Map();
let globalBucket = { start: Date.now(), count: 0 };
let activeCalls = 0;

function intEnv(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getConfig() {
  const requested = String(process.env.LLM_PROVIDER || 'openai').toLowerCase();
  const providerId = PROVIDERS[requested] ? requested : 'openai';
  const provider = PROVIDERS[providerId];
  const baseUrl = String(process.env.LLM_BASE_URL || provider.base).replace(/\/+$/, '');
  const providerKey = {
    openai: process.env.OPENAI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY
  }[providerId];
  const apiKey = String(process.env.LLM_API_KEY || providerKey || '').trim();
  const configured = provider.needsKey ? !!apiKey : !!process.env.LLM_BASE_URL;
  return {
    providerId,
    provider,
    baseUrl,
    apiKey,
    model: String(process.env.LLM_MODEL || provider.model).trim() || provider.model,
    accessCode: String(process.env.LLM_ACCESS_CODE || '').trim(),
    maxTokens: intEnv('LLM_MAX_TOKENS', 2200),
    timeoutMs: intEnv('LLM_TIMEOUT_MS', 60000),
    perHour: intEnv('LLM_RATE_LIMIT_PER_HOUR', 12),
    globalPerHour: intEnv('LLM_GLOBAL_LIMIT_PER_HOUR', 60),
    maxConcurrent: intEnv('LLM_MAX_CONCURRENT', 2),
    configured
  };
}

function clean(value, max = 300) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function dominantStat(stats) {
  const entries = Object.entries(stats || {}).filter(([key]) => STAT_LABELS[key]);
  if (!entries.length) return { label: STAT_LABELS.social, value: 3 };
  entries.sort((a, b) => b[1] - a[1]);
  return { label: STAT_LABELS[entries[0][0]], value: entries[0][1] };
}

function validateCampaignRequest(body = {}) {
  const squad = Array.isArray(body.squad) ? body.squad.slice(0, 5) : [];
  if (squad.length < 2) throw httpError(400, 'Sélectionne au moins 2 héros.');
  const safeSquad = squad.map((hero, index) => {
    const classKey = clean(hero.classKey, 30);
    const cls = CLASSES[classKey] || {};
    const stats = {
      social: clamp(hero.stats && hero.stats.social, 0, 5),
      speed: clamp(hero.stats && hero.stats.speed, 0, 5),
      channel: clamp(hero.stats && hero.stats.channel, 0, 5),
      chaos: clamp(hero.stats && hero.stats.chaos, 0, 5)
    };
    return {
      id: clean(hero.id, 80) || `hero-${index}`,
      name: clean(hero.name, 80) || 'Aventurier',
      classKey,
      className: cls.name || 'Aventurier',
      classRole: cls.role || '',
      weakness: clean(hero.weakness, 300),
      potion: clean(hero.potion, 300),
      stats
    };
  });
  let anomaly = clean(body.anomaly, 30) || 'golem';
  if (!ANOMALIES[anomaly]) anomaly = 'golem';
  const customAnomaly = clean(body.customAnomaly, 300);
  if (anomaly === 'custom' && !customAnomaly) throw httpError(400, 'Décris l’anomalie sur-mesure.');
  const sceneCount = Math.round(clamp(body.sceneCount, 2, 4));
  return { squad: safeSquad, anomaly, customAnomaly, sceneCount };
}

function buildUserPrompt({ squad, anomaly, customAnomaly, sceneCount }) {
  const roster = squad.map((hero, i) => {
    const stat = dominantStat(hero.stats);
    return `${i + 1}. [id: ${hero.id}] ${hero.name} — ${hero.className} (${hero.classRole || '?'}) — Force : ${stat.label} ${stat.value}/5 — Kryptonite : ${hero.weakness || 'non renseignée'} — Potion : ${hero.potion || 'non renseignée'}`;
  }).join('\n');
  const anomalyText = anomaly === 'custom'
    ? `Anomalie sur-mesure : ${customAnomaly}`
    : `${ANOMALIES[anomaly].name} — ${ANOMALIES[anomaly].desc}`;
  return `COMPOSITION (${squad.length} héros) :\n${roster}\n\nFRICTION :\n${anomalyText}\n\nNOMBRE TOTAL DE SCÈNES : ${sceneCount} (intro incluse). Fournis ${Math.max(1, sceneCount - 1)} scène(s) dans "scenes". Réponds uniquement avec le JSON.`;
}

async function callProvider(cfg, userPrompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    if (cfg.providerId === 'anthropic') {
      const res = await fetch(`${cfg.baseUrl}/messages`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: cfg.maxTokens,
          temperature: 0.8,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });
      if (!res.ok) throw providerError(res.status);
      const data = await res.json();
      return (data.content || []).map(part => part.text || '').join('\n');
    }

    if (cfg.providerId === 'ollama') {
      const res = await fetch(`${cfg.baseUrl}/api/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          stream: false,
          format: 'json',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }],
          options: { temperature: 0.8 }
        })
      });
      if (!res.ok) throw providerError(res.status);
      const data = await res.json();
      return data.message && data.message.content;
    }

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` };
    if (cfg.providerId === 'openrouter') {
      headers['HTTP-Referer'] = process.env.PUBLIC_URL || 'https://aetheria';
      headers['X-Title'] = 'Aetheria - Donjon';
    }
    const requestBody = (jsonMode) => JSON.stringify({
      model: cfg.model,
      temperature: 0.8,
      max_tokens: cfg.maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userPrompt }]
    });

    let res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST', signal: controller.signal, headers, body: requestBody(true)
    });
    if (!res.ok && res.status === 400) {
      res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST', signal: controller.signal, headers, body: requestBody(false)
      });
    }
    if (!res.ok) throw providerError(res.status);
    const data = await res.json();
    return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'AbortError') throw httpError(504, 'Le serveur LLM n’a pas répondu à temps.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function escapeControlCharsInStrings(text) {
  let output = '';
  let inString = false;
  let escaped = false;
  for (const char of text) {
    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        output += char;
        escaped = true;
        continue;
      }
      if (char === '"') {
        output += char;
        inString = false;
        continue;
      }
      if (char === '\n') { output += '\\n'; continue; }
      if (char === '\r') { output += '\\r'; continue; }
      if (char === '\t') { output += '\\t'; continue; }
      if (char.charCodeAt(0) < 0x20) {
        output += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
        continue;
      }
      output += char;
    } else {
      output += char;
      if (char === '"') inString = true;
    }
  }
  return output;
}

function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) throw httpError(502, 'Le serveur LLM a renvoyé une réponse illisible.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) end = text.lastIndexOf('}');
  if (end <= start) throw httpError(502, 'Le serveur LLM a renvoyé une réponse illisible.');
  return text.slice(start, end + 1);
}

export function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  if (!text) throw httpError(502, 'Le serveur LLM a renvoyé une réponse vide.');
  const candidate = escapeControlCharsInStrings(extractJsonObject(text));
  try {
    return JSON.parse(candidate);
  } catch (error) {
    // Dernier filet de sécurité : virgules finales et caractères de contrôle résiduels.
    const repaired = candidate
      .replace(/\u0000/g, '')
      .replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch (secondError) {
      throw httpError(502, 'Le serveur LLM a renvoyé un JSON invalide.');
    }
  }
}

function normalizeCampaign(obj, squad = []) {
  if (!obj || typeof obj !== 'object') throw httpError(502, 'Le serveur LLM a renvoyé une réponse vide.');
  const title = clean(obj.dungeon_title, 160);
  const intro = clean(obj.intro_narrative, 4000);
  if (!title || !intro) throw httpError(502, 'La campagne générée est incomplète.');
  const scenes = Array.isArray(obj.scenes)
    ? obj.scenes.slice(0, 3).map((scene, i) => ({
      title: clean(scene && scene.title, 120) || `Scène ${i + 2}`,
      text: clean(scene && scene.text, 3000)
    })).filter(scene => scene.text)
    : [];
  const spotlights = Array.isArray(obj.character_spotlights)
    ? obj.character_spotlights.slice(0, 6).map(spotlight => ({
      character_name: clean(spotlight && spotlight.character_name, 80),
      challenge: clean(spotlight && spotlight.challenge, 500)
    })).filter(spotlight => spotlight.character_name)
    : [];

  const reactions = Array.isArray(obj.reactions)
    ? obj.reactions.slice(0, 4).map((group, groupIndex) => {
      if (!Array.isArray(group)) return [];
      return group.slice(0, 3).map((option, i) => ({
        id: clean(option && option.id, 40) || `r${groupIndex}-${i}`,
        label: clean(option && option.label, 180),
        echo: clean(option && option.echo, 260),
        delta: Number.isFinite(Number(option && option.delta)) ? Math.round(clamp(option.delta, -4, 4)) : 0
      })).filter(option => option.label);
    }).filter(group => group.length >= 2)
    : [];

  const heroById = new Map(squad.map(hero => [hero.id, hero]));
  const heroByName = new Map(squad.map(hero => [String(hero.name).toLowerCase(), hero]));
  const seenTalent = new Set();
  const talentOptions = [];
  if (Array.isArray(obj.talent_options)) {
    for (const option of obj.talent_options.slice(0, Math.max(8, squad.length * 6))) {
      const rawId = clean(option && option.hero_id, 80);
      const hero = heroById.get(rawId) || heroByName.get(clean(option && option.hero_name, 80).toLowerCase());
      if (!hero) continue;
      const kind = clean(option && option.kind, 20);
      if (!['force', 'potion', 'krypto', 'risk'].includes(kind)) continue;
      const key = `${hero.id}:${kind}`;
      if (seenTalent.has(key)) continue;
      const label = clean(option && option.label, 240);
      const outcomeText = clean(option && option.outcome_text, 500);
      if (!label || !outcomeText) continue;
      seenTalent.add(key);
      talentOptions.push({
        id: key,
        hero_id: hero.id,
        hero_name: hero.name,
        kind,
        label,
        outcome_text: outcomeText,
        cohesion_delta: Number.isFinite(Number(option && option.cohesion_delta))
          ? Math.round(clamp(option.cohesion_delta, -15, 20))
          : 0
      });
    }
  }

  const rawDebrief = obj.debrief && typeof obj.debrief === 'object' ? obj.debrief : null;
  const debrief = rawDebrief ? {
    success: clean(rawDebrief.success, 1500),
    failure: clean(rawDebrief.failure, 1500),
    mirror_questions: Array.isArray(rawDebrief.mirror_questions)
      ? rawDebrief.mirror_questions.slice(0, 4).map(question => clean(question, 300)).filter(Boolean)
      : [],
    profile_questions: Array.isArray(rawDebrief.profile_questions)
      ? rawDebrief.profile_questions.slice(0, 6).map(item => {
        const rawId = clean(item && item.hero_id, 80);
        const hero = heroById.get(rawId) || heroByName.get(clean(item && item.hero_name, 80).toLowerCase());
        return { hero_id: hero ? hero.id : rawId, question: clean(item && item.question, 300) };
      }).filter(item => item.question)
      : [],
    pact_focus: clean(rawDebrief.pact_focus, 500)
  } : null;

  return {
    dungeon_title: title,
    intro_narrative: intro,
    scenes,
    character_spotlights: spotlights,
    reactions,
    talent_options: talentOptions,
    debrief,
    real_world_agreement: clean(obj.real_world_agreement, 500)
  };
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function providerError(status) {
  console.warn('[LLM] Fournisseur indisponible, HTTP', status);
  return httpError(502, 'Le service LLM est momentanément indisponible.');
}

function sameOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get('host');
  } catch (error) {
    return false;
  }
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

function allowRequest(ip, cfg) {
  const now = Date.now();
  if (now - globalBucket.start >= 3600000) globalBucket = { start: now, count: 0 };
  if (globalBucket.count >= cfg.globalPerHour) return { ok: false, retryAfter: Math.ceil((globalBucket.start + 3600000 - now) / 1000) };
  if (activeCalls >= cfg.maxConcurrent) return { ok: false, retryAfter: 5 };
  let bucket = buckets.get(ip);
  if (!bucket || now - bucket.start >= 3600000) {
    bucket = { start: now, count: 0 };
    buckets.set(ip, bucket);
  }
  if (bucket.count >= cfg.perHour) return { ok: false, retryAfter: Math.ceil((bucket.start + 3600000 - now) / 1000) };
  bucket.count += 1;
  globalBucket.count += 1;
  if (buckets.size > 5000) {
    for (const [key, value] of buckets) {
      if (now - value.start >= 3600000) buckets.delete(key);
    }
  }
  return { ok: true };
}

export function getLlmStatus() {
  const cfg = getConfig();
  return {
    configured: cfg.configured,
    provider: cfg.providerId,
    providerLabel: cfg.provider.label,
    model: cfg.model,
    requiresCode: !!cfg.accessCode,
    rateLimit: { perHour: cfg.perHour, globalPerHour: cfg.globalPerHour },
    message: cfg.configured ? '' : 'Le service LLM n’est pas configuré sur ce serveur.'
  };
}

export async function handleLlmCampaign(req, res) {
  res.set('Cache-Control', 'no-store');
  const cfg = getConfig();
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origine non autorisée.' });
  if (!cfg.configured) return res.status(503).json({ error: 'Le service LLM n’est pas configuré sur ce serveur.' });
  if (cfg.accessCode && !safeEqual(req.get('x-aetheria-llm-code'), cfg.accessCode)) {
    return res.status(401).json({ error: 'Code d’accès serveur invalide.' });
  }

  let payload;
  try {
    payload = validateCampaignRequest(req.body || {});
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const allowed = allowRequest(ip, cfg);
  if (!allowed.ok) {
    res.set('Retry-After', String(allowed.retryAfter || 60));
    return res.status(429).json({ error: 'Trop de requêtes LLM. Réessaie un peu plus tard.', retryAfter: allowed.retryAfter });
  }

  activeCalls += 1;
  let raw = '';
  try {
    const userPrompt = buildUserPrompt(payload);
    raw = await callProvider(cfg, userPrompt);
    const campaign = normalizeCampaign(parseJsonObject(raw), payload.squad);
    res.json({ campaign });
  } catch (error) {
    const status = error.status || 502;
    if (status >= 500) {
      console.warn('[LLM]', error.message);
      if (raw) {
        console.warn('[LLM] Réponse brute :', String(raw).length, 'caractères | début :', String(raw).replace(/\s+/g, ' ').slice(0, 300));
        console.warn('[LLM] Fin de réponse :', String(raw).replace(/\s+/g, ' ').slice(-220));
      }
    }
    res.status(status).json({ error: error.message || 'Le service LLM est momentanément indisponible.' });
  } finally {
    activeCalls = Math.max(0, activeCalls - 1);
  }
}
