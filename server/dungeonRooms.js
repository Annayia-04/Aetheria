// Aetheria — Salles de donjon multi-joueurs (en mémoire).
// Les parties sont éphémères : elles vivent le temps de l'atelier.

const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 4 * 60 * 60 * 1000;

function randomId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function cleanup() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) rooms.delete(code);
  }
}

function publicRoom(room) {
  return {
    code: room.code,
    createdAt: room.createdAt,
    campaign: room.campaign,
    squad: room.squad,
    anomaly: room.anomaly,
    length: room.length,
    phase: room.phase,
    sceneIndex: room.sceneIndex,
    hostId: room.hostId,
    players: room.players,
    answers: room.answers,
    votes: room.votes,
    reactions: room.reactions,
    decision: room.decision,
    result: room.result,
    pact: room.pact || '',
    answersCount: Object.keys(room.answers).length,
    votesCount: Object.keys(room.votes).length,
    reactionsCount: Object.values(room.reactions || {}).reduce((sum, byScene) => sum + Object.keys(byScene || {}).length, 0)
  };
}

function getRoom(code) {
  cleanup();
  const room = rooms.get(String(code || '').toUpperCase());
  if (!room) {
    const error = new Error('Salle introuvable ou expirée.');
    error.status = 404;
    throw error;
  }
  return room;
}

function assertHost(room, playerId) {
  if (!playerId || playerId !== room.hostId) {
    const error = new Error('Action réservée à l’hôte de la table.');
    error.status = 403;
    throw error;
  }
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function campaignOptions(room) {
  const c = room.campaign || {};
  if (Array.isArray(c.talent_options) && c.talent_options.length) return c.talent_options;
  return Array.isArray(c.choices) ? c.choices : [];
}

function tallyVotes(room) {
  const counts = {};
  Object.values(room.votes).forEach(vote => {
    const ids = Array.isArray(vote.choiceIds) ? vote.choiceIds : (vote.choiceId ? [vote.choiceId] : []);
    ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const planIds = sorted.slice(0, 4).map(([id]) => id);
  return { optionIds: planIds, counts };
}

export const DungeonRooms = {
  create({ campaign, squad, anomaly, length, hostHeroId, hostName }) {
    const hasOptions = campaign && (Array.isArray(campaign.talent_options) || Array.isArray(campaign.choices));
    if (!hasOptions || (campaign.talent_options || campaign.choices || []).length === 0) {
      const error = new Error('Campagne invalide.');
      error.status = 400;
      throw error;
    }
    if (!Array.isArray(squad) || squad.length === 0) {
      const error = new Error('Escouade invalide.');
      error.status = 400;
      throw error;
    }
    cleanup();
    const code = makeCode();
    const host = {
      id: randomId('p'),
      heroId: hostHeroId || squad[0].id || squad[0].name,
      name: hostName || squad[0].name || 'Hôte',
      joinedAt: Date.now(),
      host: true
    };
    const room = {
      code,
      createdAt: Date.now(),
      campaign,
      squad,
      anomaly: anomaly || 'custom',
      length: length || 'standard',
      phase: 'narration',
      sceneIndex: 0,
      hostId: host.id,
      players: [host],
      answers: {},
      votes: {},
      reactions: {},
      decision: null,
      result: null,
      pact: ''
    };
    rooms.set(code, room);
    return { code, playerId: host.id, room: publicRoom(room) };
  },

  get(code) {
    return publicRoom(getRoom(code));
  },

  join(code, { heroId, playerName }) {
    const room = getRoom(code);
    if (room.phase === 'debrief') {
      const error = new Error('La table a déjà terminé sa quête.');
      error.status = 409;
      throw error;
    }
    const hero = (room.squad || []).find(h => (h.id || h.name) === heroId);
    if (!hero) {
      const error = new Error('Ce personnage ne fait pas partie de l’escouade.');
      error.status = 404;
      throw error;
    }
    const claimed = room.players.some(p => p.heroId === (hero.id || hero.name));
    if (claimed) {
      const error = new Error('Ce personnage est déjà incarné par un autre joueur.');
      error.status = 409;
      throw error;
    }
    const player = {
      id: randomId('p'),
      heroId: hero.id || hero.name,
      name: hero.name || playerName || 'Aventurier',
      classKey: hero.classKey || '',
      weakness: hero.weakness || '',
      potion: hero.potion || '',
      stats: hero.stats || {},
      joinedAt: Date.now(),
      host: false
    };
    room.players.push(player);
    return { playerId: player.id, room: publicRoom(room) };
  },

  answer(code, playerId, { choiceIds, choiceId, note }) {
    const room = getRoom(code);
    if (room.phase !== 'answers') {
      const error = new Error('Les réponses individuelles sont closes.');
      error.status = 409;
      throw error;
    }
    if (!room.players.some(p => p.id === playerId)) {
      const error = new Error('Joueur inconnu.');
      error.status = 403;
      throw error;
    }
    const options = campaignOptions(room);
    let ids = Array.isArray(choiceIds) ? choiceIds : (choiceId ? [choiceId] : []);
    ids = ids.filter(id => options.some(o => o.id === id)).slice(0, 4);
    if (!ids.length) {
      const error = new Error('Aucune option valide sélectionnée.');
      error.status = 400;
      throw error;
    }
    room.answers[playerId] = {
      choiceIds: ids,
      note: String(note || '').slice(0, 400),
      at: Date.now()
    };
    return publicRoom(room);
  },

  setScene(code, playerId, sceneIndex) {
    const room = getRoom(code);
    assertHost(room, playerId);
    if (room.phase !== 'narration') {
      const error = new Error('Le récit est déjà terminé.');
      error.status = 409;
      throw error;
    }
    room.sceneIndex = clamp(Math.round(Number(sceneIndex) || 0), 0, 12);
    return publicRoom(room);
  },

  reaction(code, playerId, { sceneIndex, optionId }) {
    const room = getRoom(code);
    if (!room.players.some(p => p.id === playerId)) {
      const error = new Error('Joueur inconnu.');
      error.status = 403;
      throw error;
    }
    if (room.phase !== 'narration') {
      const error = new Error('Les répliques de scène sont closes.');
      error.status = 409;
      throw error;
    }
    const idx = clamp(Math.round(Number(sceneIndex) || 0), 0, 12);
    if (!room.reactions[playerId]) room.reactions[playerId] = {};
    room.reactions[playerId][idx] = { optionId: String(optionId || '').slice(0, 30), at: Date.now() };
    return publicRoom(room);
  },

  setPhase(code, playerId, phase) {
    const room = getRoom(code);
    assertHost(room, playerId);
    if (phase === 'answers') {
      if (room.phase !== 'narration') {
        const error = new Error('La table n’est pas au récit.');
        error.status = 409;
        throw error;
      }
      room.phase = 'answers';
    }
    if (phase === 'vote') {
      if (!['answers', 'vote'].includes(room.phase)) {
        const error = new Error('La table n’est pas au stade des réponses.');
        error.status = 409;
        throw error;
      }
      room.phase = 'vote';
    }
    return publicRoom(room);
  },

  vote(code, playerId, { choiceIds, choiceId }) {
    const room = getRoom(code);
    if (room.phase !== 'vote') {
      const error = new Error('Le vote n’est pas ouvert.');
      error.status = 409;
      throw error;
    }
    if (!room.players.some(p => p.id === playerId)) {
      const error = new Error('Joueur inconnu.');
      error.status = 403;
      throw error;
    }
    const options = campaignOptions(room);
    let ids = Array.isArray(choiceIds) ? choiceIds : (choiceId ? [choiceId] : []);
    ids = ids.filter(id => options.some(o => o.id === id)).slice(0, 4);
    if (!ids.length) {
      const error = new Error('Aucun vote valide.');
      error.status = 400;
      throw error;
    }
    room.votes[playerId] = { choiceIds: ids, at: Date.now() };

    const allVoted = room.players.every(p => room.votes[p.id]);
    if (allVoted) {
      const tally = tallyVotes(room);
      if (tally.optionIds.length) {
        room.decision = { optionIds: tally.optionIds, counts: tally.counts, at: Date.now() };
        room.phase = 'roll';
      }
    }
    return publicRoom(room);
  },

  closeVote(code, playerId) {
    const room = getRoom(code);
    assertHost(room, playerId);
    if (room.phase !== 'vote') {
      const error = new Error('Le vote n’est pas ouvert.');
      error.status = 409;
      throw error;
    }
    const tally = tallyVotes(room);
    if (!tally.optionIds.length) {
      const error = new Error('Aucun vote enregistré.');
      error.status = 409;
      throw error;
    }
    room.decision = { optionIds: tally.optionIds, counts: tally.counts, at: Date.now() };
    room.phase = 'roll';
    return publicRoom(room);
  },

  roll(code, playerId, { roll }) {
    const room = getRoom(code);
    assertHost(room, playerId);
    if (room.phase !== 'roll' || !room.decision) {
      const error = new Error('Le jet n’est pas attendu.');
      error.status = 409;
      throw error;
    }
    const value = clamp(Math.round(Number(roll) || 1), 1, 20);
    const options = campaignOptions(room);
    const plan = options.filter(o => room.decision.optionIds.includes(o.id));
    if (!plan.length) {
      const error = new Error('Le plan de la table est vide.');
      error.status = 409;
      throw error;
    }
    const rawDelta = clamp(plan.reduce((sum, o) => sum + (Number(o.cohesion_delta) || 0), 0), -25, 25);
    const success = value >= 11;
    const delta = success ? rawDelta : Math.round(rawDelta / 2);
    const cohesion = clamp(50 + delta, 0, 100);
    room.result = {
      optionIds: plan.map(o => o.id),
      roll: value,
      bonus: 0,
      total: value,
      success,
      rawDelta,
      delta,
      cohesion
    };
    room.phase = 'debrief';
    return publicRoom(room);
  },

  setPact(code, playerId, text) {
    const room = getRoom(code);
    if (!room.players.some(p => p.id === playerId)) {
      const error = new Error('Joueur inconnu.');
      error.status = 403;
      throw error;
    }
    room.pact = String(text || '').slice(0, 6000);
    return publicRoom(room);
  },

  close(code, playerId) {
    const room = getRoom(code);
    assertHost(room, playerId);
    rooms.delete(room.code);
    return { closed: true };
  },

  leave(code, playerId) {
    const room = getRoom(code);
    room.players = room.players.filter(p => p.id !== playerId);
    delete room.answers[playerId];
    delete room.votes[playerId];
    delete room.reactions[playerId];
    if (room.players.length === 0) {
      rooms.delete(room.code);
      return { closed: true };
    }
    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
      room.players[0].host = true;
    }
    return publicRoom(room);
  }
};

export default DungeonRooms;
