// Aetheria — Database layer with sql.js (SQLite in WASM)
// ==========================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_TYPE = process.env.DATABASE_TYPE || 'sqlite';
const SQLITE_PATH = process.env.SQLITE_PATH || './data/aetheria.db';

let db = null;
let SQL = null;

export async function getDatabase() {
  if (db) return db;

  // Initialize sql.js with local WASM file
  const SQLModule = await initSqlJs({
    locateFile: () => path.join(__dirname, 'sql-wasm.wasm')
  });
  SQL = SQLModule;

  if (DB_TYPE === 'sqlite') {
    const dataDir = path.dirname(SQLITE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let filebuffer;
    if (fs.existsSync(SQLITE_PATH)) {
      filebuffer = fs.readFileSync(SQLITE_PATH);
    }

    db = new SQLModule.Database(filebuffer);
    console.log('[DB] SQL.js connected:', SQLITE_PATH);
  } else {
    throw new Error('PostgreSQL not implemented yet. Use SQLite for now.');
  }

  return db;
}

// Helper: execute prepared statement and return all rows
function execPrepared(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run prepared statement (INSERT, UPDATE, DELETE)
function runPrepared(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.run();
  stmt.free();
  // sql.js reports affected rows on the database object
  return { changes: typeof db.getRowsModified === 'function' ? db.getRowsModified() : 1 };
}

// Helper: run prepared statement and return single row
function getPrepared(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  // Heroes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS heroes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      guild TEXT,
      class_key TEXT NOT NULL,
      title TEXT,
      stats_social INTEGER DEFAULT 3,
      stats_speed INTEGER DEFAULT 3,
      stats_channel INTEGER DEFAULT 3,
      stats_chaos INTEGER DEFAULT 3,
      ultimate TEXT,
      weakness TEXT,
      potion TEXT,
      appearance_json TEXT NOT NULL,
      is_legend INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_heroes_guild ON heroes(guild);
    CREATE INDEX IF NOT EXISTS idx_heroes_class ON heroes(class_key);
    CREATE INDEX IF NOT EXISTS idx_heroes_legend ON heroes(is_legend);
    CREATE INDEX IF NOT EXISTS idx_heroes_updated ON heroes(updated_at DESC);
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Seed default guild roster if empty
  const countRow = getPrepared(db, 'SELECT COUNT(*) as c FROM heroes');
  const count = countRow ? countRow.c : 0;
  if (count === 0) {
    seedDefaultRoster(db);
  }

  console.log('[DB] Schema initialized');
  return db;
}

function seedDefaultRoster(db) {
  const now = Date.now();
  const defaults = [
    {
      id: 'hero-001',
      name: 'Damoiselle Camille',
      guild: 'Equipe 1 - Datacrons',
      classKey: 'ranger',
      title: "L'Eclaireuse des API",
      stats: { social: 2, speed: 3, channel: 1, chaos: 4 },
      ultimate: "Epluche la documentation technique et trouve la solution en solo.",
      weakness: 'Les reunions de 2 heures sans ordre du jour precis.',
      potion: 'Ecris-moi sur Slack avec le lien du bug et laisse-moi 30 min.',
      appearance: { race: 'elf', skin: 'moon', build: 'slender', height: 'tall', posture: 'ready', face: 'oval', eyes: 'green', expression: 'determined', mark: 'freckles', facialHair: 'none', warpaint: 'none', hairStyle: 'braids', hairColor: 'red', hairHighlight: 'golden', outfit: 'leather-green', headgear: 'hood-up', artifact: 'dagger', aura: 'emerald', frame: 'nature', backdrop: 'forest', lighting: 'natural', particles: 'leaves' }
    },
    {
      id: 'hero-002',
      name: 'Mage Sofiane',
      guild: 'Equipe 2 - WebSpells',
      classKey: 'bard',
      title: "L'Orateur Inspire",
      stats: { social: 5, speed: 5, channel: 4, chaos: 5 },
      ultimate: 'Structure des slides percutantes et donne l\'envie d\'avancer.',
      weakness: 'Le manque d\'enthousiasme et les silences genants en reu.',
      potion: 'Prends un cafe avec moi pour rebondir sur une idee a la fois.',
      appearance: { race: 'human', skin: 'olive', build: 'average', height: 'average', posture: 'swagger', face: 'heart', eyes: 'hazel', expression: 'smirk', mark: 'none', facialHair: 'goatee', warpaint: 'none', hairStyle: 'curly-short', hairColor: 'black', hairHighlight: 'silver', outfit: 'velvet-blue', headgear: 'circlet', artifact: 'lute', aura: 'violet', frame: 'ornate', backdrop: 'tavern', lighting: 'candlelight', particles: 'sparkles' }
    },
    {
      id: 'hero-003',
      name: 'Docteur Yuna',
      guild: 'Equipe 3 - Algomanciens',
      classKey: 'alchemist',
      title: "L'Horlogere du Pixel",
      stats: { social: 2, speed: 2, channel: 3, chaos: 1 },
      ultimate: 'Traque les alignements foireux et rend le produit ultra pro.',
      weakness: 'Pousser du code a minuit sans tester sur mobile.',
      potion: 'Rappelle-moi la contrainte de temps pour qu\'on coupe dans les details.',
      appearance: { race: 'human', skin: 'peach', build: 'average', height: 'short', posture: 'straight', face: 'oval', eyes: 'blue', expression: 'stern', mark: 'rune-forehead', facialHair: 'none', warpaint: 'geometric', hairStyle: 'topknot', hairColor: 'silver', hairHighlight: 'blue', outfit: 'robe-alchemist', headgear: 'glasses', artifact: 'potion', aura: 'cyan', frame: 'runic', backdrop: 'lab', lighting: 'magic', particles: 'bubbles' }
    },
    {
      id: 'hero-004',
      name: 'Sire Valerian',
      guild: 'Projet Fil Rouge #03',
      classKey: 'paladin',
      title: 'Le Batisseur Methodique',
      stats: { social: 3, speed: 4, channel: 2, chaos: 2 },
      ultimate: 'Structure les sprints et decoupe les taches en jalons limpides.',
      weakness: 'Le silence de plus de 12h & les changements d\'objectifs la veille du jalon.',
      potion: 'Par message direct avec les 2 actions concretes attendues.',
      appearance: { race: 'human', skin: 'peach', build: 'athletic', height: 'average', posture: 'straight', face: 'square', eyes: 'amber', expression: 'determined', mark: 'scar-eye', facialHair: 'stubble', warpaint: 'none', hairStyle: 'crew', hairColor: 'darkbrown', hairHighlight: 'none', outfit: 'plate-gold', headgear: 'none', artifact: 'scroll', aura: 'gold', frame: 'classic', backdrop: 'fortress', lighting: 'golden-hour', particles: 'sparkles' }
    }
  ];

  const insert = db.prepare(`
    INSERT INTO heroes (id, name, guild, class_key, title,
      stats_social, stats_speed, stats_channel, stats_chaos,
      ultimate, weakness, potion, appearance_json,
      is_legend, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const h of defaults) {
    insert.run([
      h.id, h.name, h.guild, h.classKey, h.title,
      h.stats.social, h.stats.speed, h.stats.channel, h.stats.chaos,
      h.ultimate, h.weakness, h.potion,
      JSON.stringify(h.appearance),
      0, now, now
    ]);
  }
  saveDatabase();
  console.log('[DB] Default roster seeded');
}

// Save database to file periodically
function saveDatabase() {
  if (db && SQLITE_PATH) {
    try {
      const data = db.export();
      fs.writeFileSync(SQLITE_PATH, Buffer.from(data));
    } catch (e) {
      console.warn('[DB] Save failed:', e);
    }
  }
}

setInterval(saveDatabase, 5000);
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(0); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(0); });

// Hero CRUD
export const HeroModel = {
  async getAll(filters = {}) {
    const db = await getDatabase();
    let sql = 'SELECT * FROM heroes WHERE 1=1';
    const params = [];

    if (filters.classKey) {
      sql += ' AND class_key = ?';
      params.push(filters.classKey);
    }
    if (filters.guild) {
      sql += ' AND guild LIKE ?';
      params.push(`%${filters.guild}%`);
    }
    if (filters.search) {
      sql += ' AND (name LIKE ? OR title LIKE ? OR guild LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    if (filters.legendOnly) {
      sql += ' AND is_legend = 1';
    }

    sql += ' ORDER BY updated_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    const rows = execPrepared(db, sql, params);
    return rows.map(row => this.deserialize(row));
  },

  async getById(id) {
    const db = await getDatabase();
    const row = getPrepared(db, 'SELECT * FROM heroes WHERE id = ?', [id]);
    return row ? this.deserialize(row) : null;
  },

  async create(hero) {
    const db = await getDatabase();

    // Saving a character whose name already exists overwrites that character
    // instead of creating a duplicate.
    const normalizedName = String(hero.name || '').trim();
    if (normalizedName) {
      const clash = getPrepared(db, 'SELECT id FROM heroes WHERE name = ? COLLATE NOCASE LIMIT 1', [normalizedName]);
      if (clash) return this.update(clash.id, { ...hero, id: clash.id });
    }

    const now = Date.now();
    const id = hero.id || `hero-${now}-${Math.random().toString(36).slice(2, 9)}`;

    runPrepared(db, `
      INSERT INTO heroes (id, name, guild, class_key, title,
        stats_social, stats_speed, stats_channel, stats_chaos,
        ultimate, weakness, potion, appearance_json,
        is_legend, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, hero.name, hero.guild || '', hero.classKey, hero.title || '',
      hero.stats?.social ?? 3, hero.stats?.speed ?? 3, hero.stats?.channel ?? 3, hero.stats?.chaos ?? 3,
      hero.ultimate || '', hero.weakness || '', hero.potion || '',
      JSON.stringify(hero.appearance || {}),
      hero.isLegend ? 1 : 0,
      now, now
    ]);

    saveDatabase();
    return this.getById(id);
  },

  async update(id, updates) {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: Date.now() };

    runPrepared(db, `
      UPDATE heroes SET
        name = ?, guild = ?, class_key = ?, title = ?,
        stats_social = ?, stats_speed = ?, stats_channel = ?, stats_chaos = ?,
        ultimate = ?, weakness = ?, potion = ?,
        appearance_json = ?, is_legend = ?, updated_at = ?
      WHERE id = ?
    `, [
      merged.name, merged.guild, merged.classKey, merged.title,
      merged.stats.social, merged.stats.speed, merged.stats.channel, merged.stats.chaos,
      merged.ultimate, merged.weakness, merged.potion,
      JSON.stringify(merged.appearance),
      merged.isLegend ? 1 : 0,
      merged.updatedAt, id
    ]);

    saveDatabase();
    return this.getById(id);
  },

  async delete(id) {
    const db = await getDatabase();
    const result = runPrepared(db, 'DELETE FROM heroes WHERE id = ?', [id]);
    saveDatabase();
    return result.changes > 0;
  },

  async duplicate(id) {
    const original = await this.getById(id);
    if (!original) return null;
    const copy = { ...original };
    delete copy.id;
    copy.name = `${copy.name} (Copie)`;
    copy.isLegend = false;
    return this.create(copy);
  },

  deserialize(row) {
    return {
      id: row.id,
      name: row.name,
      guild: row.guild,
      classKey: row.class_key,
      title: row.title,
      stats: {
        social: row.stats_social,
        speed: row.stats_speed,
        channel: row.stats_channel,
        chaos: row.stats_chaos
      },
      ultimate: row.ultimate,
      weakness: row.weakness,
      potion: row.potion,
      appearance: JSON.parse(row.appearance_json || '{}'),
      isLegend: Boolean(row.is_legend),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

// Settings
export const SettingsModel = {
  async get(key) {
    const db = await getDatabase();
    const row = getPrepared(db, 'SELECT value_json FROM settings WHERE key = ?', [key]);
    return row ? JSON.parse(row.value_json) : null;
  },

  async set(key, value) {
    const db = await getDatabase();
    const now = Date.now();
    runPrepared(db, `
      INSERT INTO settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `, [key, JSON.stringify(value), now]);
    saveDatabase();
  }
};

// Initialize on import
initializeDatabase();

export default { HeroModel, SettingsModel, getDatabase };