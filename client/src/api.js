// API Client for Aetheria Backend
const API_BASE = '/api';

class API {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    };
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // Heroes
  static getHeroes(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    return this.request(`/heroes?${params.toString()}`);
  }

  static getHero(id) {
    return this.request(`/heroes/${id}`);
  }

  static createHero(hero) {
    return this.request('/heroes', { method: 'POST', body: hero });
  }

  static updateHero(id, updates) {
    return this.request(`/heroes/${id}`, { method: 'PUT', body: updates });
  }

  static deleteHero(id) {
    return this.request(`/heroes/${id}`, { method: 'DELETE' });
  }

  static duplicateHero(id) {
    return this.request(`/heroes/${id}/duplicate`, { method: 'POST' });
  }

  // Settings
  static getSetting(key) {
    return this.request(`/settings/${key}`);
  }

  static setSetting(key, value) {
    return this.request(`/settings/${key}`, { method: 'PUT', body: { value } });
  }

  // Health
  static health() {
    return this.request('/health');
  }
}

// Offline-first wrapper with localStorage cache
export const OfflineAPI = {
  cache: new Map(),
  pendingWrites: [],

  async getHeroes(filters = {}) {
    try {
      const data = await API.getHeroes(filters);
      this.cache.set('heroes', data.heroes);
      return data;
    } catch (e) {
      console.warn('[API] Offline, using cache');
      return { heroes: this.cache.get('heroes') || [], total: this.cache.get('heroes')?.length || 0, offline: true };
    }
  },

  async getHero(id) {
    try {
      return await API.getHero(id);
    } catch (e) {
      const cached = this.cache.get('heroes')?.find(h => h.id === id);
      if (cached) return { ...cached, offline: true };
      throw e;
    }
  },

  async createHero(hero) {
    try {
      return await API.createHero(hero);
    } catch (e) {
      // Queue for later sync
      this.pendingWrites.push({ type: 'create', hero, timestamp: Date.now() });
      this.savePending();
      // Optimistic update
      const tempHero = { ...hero, id: hero.id || `temp-${Date.now()}`, offline: true };
      const cached = this.cache.get('heroes') || [];
      cached.unshift(tempHero);
      this.cache.set('heroes', cached);
      return tempHero;
    }
  },

  async updateHero(id, updates) {
    try {
      return await API.updateHero(id, updates);
    } catch (e) {
      this.pendingWrites.push({ type: 'update', id, updates, timestamp: Date.now() });
      this.savePending();
      const cached = this.cache.get('heroes') || [];
      const idx = cached.findIndex(h => h.id === id);
      if (idx >= 0) cached[idx] = { ...cached[idx], ...updates, offline: true };
      this.cache.set('heroes', cached);
      return cached[idx];
    }
  },

  async deleteHero(id) {
    try {
      await API.deleteHero(id);
      const cached = this.cache.get('heroes') || [];
      this.cache.set('heroes', cached.filter(h => h.id !== id));
    } catch (e) {
      this.pendingWrites.push({ type: 'delete', id, timestamp: Date.now() });
      this.savePending();
      const cached = this.cache.get('heroes') || [];
      this.cache.set('heroes', cached.filter(h => h.id !== id));
    }
  },

  async duplicateHero(id) {
    try {
      return await API.duplicateHero(id);
    } catch (e) {
      const original = this.cache.get('heroes')?.find(h => h.id === id);
      if (!original) throw e;
      const copy = { ...original, id: `temp-${Date.now()}`, name: `${original.name} (Copie)`, isLegend: false, offline: true };
      const cached = this.cache.get('heroes') || [];
      cached.unshift(copy);
      this.cache.set('heroes', cached);
      return copy;
    }
  },

  savePending() {
    try { localStorage.setItem('aetheria_pending_writes', JSON.stringify(this.pendingWrites)); } catch {}
  },

  loadPending() {
    try { this.pendingWrites = JSON.parse(localStorage.getItem('aetheria_pending_writes') || '[]'); } catch { this.pendingWrites = []; }
  },

  async syncPending() {
    this.loadPending();
    for (const write of this.pendingWrites) {
      try {
        if (write.type === 'create') await API.createHero(write.hero);
        else if (write.type === 'update') await API.updateHero(write.id, write.updates);
        else if (write.type === 'delete') await API.deleteHero(write.id);
        this.pendingWrites = this.pendingWrites.filter(w => w !== write);
      } catch (e) { console.warn('[Sync] Failed:', write, e); }
    }
    this.savePending();
  }
};

// Auto-sync when online
window.addEventListener('online', () => OfflineAPI.syncPending());
setInterval(() => OfflineAPI.syncPending(), 30000);

export { API };
export default API;