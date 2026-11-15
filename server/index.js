import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { HeroModel, SettingsModel } from './database.js';
import DungeonRooms from './dungeonRooms.js';
import { getLlmStatus, handleLlmCampaign } from './llm.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Allow multiple origins for development and same-origin production deployments.
// The API is public (no auth), so reflecting the request origin is safe here.
// If authentication is added later, replace this with a strict allow-list.
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for dev
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: function (origin, callback) {
    // Same-origin and server-to-server requests have no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // Production: the app is served by this same server, so accept its own origin.
    return callback(null, true);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// LLM sécurisé : statut public (sans secret) + proxy de génération.
app.get('/api/llm/status', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(getLlmStatus());
});
app.post('/api/llm/campaign', handleLlmCampaign);

// ============================================
// HEROES REST API
// ============================================

// GET /api/heroes - List with filters
app.get('/api/heroes', async (req, res) => {
  try {
    const { classKey, guild, search, legendOnly, limit, offset } = req.query;
    const heroes = await HeroModel.getAll({
      classKey,
      guild,
      search,
      legendOnly: legendOnly === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json({ heroes, total: heroes.length });
  } catch (error) {
    console.error('[API] Error fetching heroes:', error);
    res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

// GET /api/heroes/:id - Single hero
app.get('/api/heroes/:id', async (req, res) => {
  try {
    const hero = await HeroModel.getById(req.params.id);
    if (!hero) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    res.json(hero);
  } catch (error) {
    console.error('[API] Error fetching hero:', error);
    res.status(500).json({ error: 'Failed to fetch hero' });
  }
});

// POST /api/heroes - Create hero
app.post('/api/heroes', async (req, res) => {
  try {
    const { name, classKey } = req.body;
    if (!name?.trim() || !classKey) {
      return res.status(400).json({ error: 'Name and classKey are required' });
    }
    const hero = await HeroModel.create(req.body);
    res.status(201).json(hero);
  } catch (error) {
    console.error('[API] Error creating hero:', error);
    res.status(500).json({ error: 'Failed to create hero' });
  }
});

// PUT /api/heroes/:id - Update hero
app.put('/api/heroes/:id', async (req, res) => {
  try {
    const hero = await HeroModel.update(req.params.id, req.body);
    if (!hero) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    res.json(hero);
  } catch (error) {
    console.error('[API] Error updating hero:', error);
    res.status(500).json({ error: 'Failed to update hero' });
  }
});

// DELETE /api/heroes/:id - Delete hero
app.delete('/api/heroes/:id', async (req, res) => {
  try {
    const deleted = await HeroModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting hero:', error);
    res.status(500).json({ error: 'Failed to delete hero' });
  }
});

// POST /api/heroes/:id/duplicate - Duplicate hero
app.post('/api/heroes/:id/duplicate', async (req, res) => {
  try {
    const hero = await HeroModel.duplicate(req.params.id);
    if (!hero) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    res.status(201).json(hero);
  } catch (error) {
    console.error('[API] Error duplicating hero:', error);
    res.status(500).json({ error: 'Failed to duplicate hero' });
  }
});

// ============================================
// SETTINGS
// ============================================
app.get('/api/settings/:key', async (req, res) => {
  const value = await SettingsModel.get(req.params.key);
  res.json({ key: req.params.key, value });
});

app.put('/api/settings/:key', async (req, res) => {
  await SettingsModel.set(req.params.key, req.body.value);
  res.json({ success: true });
});

// ============================================
// DUNGEON ROOMS — Table de guilde multi-joueurs
// ============================================
const roomError = (res, error) => res.status(error.status || 500).json({ error: error.message || 'Erreur de table' });

app.post('/api/dungeon/rooms', (req, res) => {
  try { res.status(201).json(DungeonRooms.create(req.body || {})); } catch (error) { roomError(res, error); }
});

app.get('/api/dungeon/rooms/:code', (req, res) => {
  try { res.json(DungeonRooms.get(req.params.code)); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/join', (req, res) => {
  try { res.json(DungeonRooms.join(req.params.code, req.body || {})); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/answer', (req, res) => {
  try { res.json(DungeonRooms.answer(req.params.code, req.body?.playerId, req.body || {})); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/phase', (req, res) => {
  try { res.json(DungeonRooms.setPhase(req.params.code, req.body?.playerId, req.body?.phase)); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/scene', (req, res) => {
  try { res.json(DungeonRooms.setScene(req.params.code, req.body?.playerId, req.body?.sceneIndex)); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/reaction', (req, res) => {
  try { res.json(DungeonRooms.reaction(req.params.code, req.body?.playerId, req.body || {})); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/vote', (req, res) => {
  try { res.json(DungeonRooms.vote(req.params.code, req.body?.playerId, req.body || {})); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/vote-close', (req, res) => {
  try { res.json(DungeonRooms.closeVote(req.params.code, req.body?.playerId)); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/roll', (req, res) => {
  try { res.json(DungeonRooms.roll(req.params.code, req.body?.playerId, req.body || {})); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/pact', (req, res) => {
  try { res.json(DungeonRooms.setPact(req.params.code, req.body?.playerId, req.body?.text)); } catch (error) { roomError(res, error); }
});

app.post('/api/dungeon/rooms/:code/leave', (req, res) => {
  try { res.json(DungeonRooms.leave(req.params.code, req.body?.playerId)); } catch (error) { roomError(res, error); }
});

app.delete('/api/dungeon/rooms/:code', (req, res) => {
  try { res.json(DungeonRooms.close(req.params.code, req.body?.playerId || req.query.playerId)); } catch (error) { roomError(res, error); }
});

// ============================================
// STATIC FILES (production)
// ============================================
const clientDist = path.join(__dirname, '../dist');
const serveClient = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(clientDist, 'index.html'));
if (serveClient) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Client URL: ${CLIENT_URL}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;