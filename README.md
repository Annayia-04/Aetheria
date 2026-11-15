# Aetheria — Forge de Héros 3D

> Application PWA de création de personnage RPG en **3D temps réel**, avec backend persistant, direction artistique médiévale-fantasy et déploiement Docker-ready.

![Aetheria Preview](client/public/apple-touch-icon.svg)

## ✨ Fonctionnalités

### 🎨 Forge 3D (Character Creator)
- **Avatar 3D temps réel** (Three.js) avec ombres, lumières, particules
- **6 Races** : Humain, Elfe, Nain, Orque, Tieffelin, Halfelin
- **23 Coiffures**, **24 Couleurs cheveux**, **12 Reflets**
- **10 Expressions**, **10 Marques/Cicatrices**, **10 Pilosités**, **7 Warpaints**
- **6 Tenues par classe**, **13 Couvre-chefs**, **14 Artefacts**, **10 Auras**
- **7 Cadres**, **10 Décors**, **9 Éclairages**, **10 Particules**
- Animation idle (respiration, clignement, balancement cape, flamme torche)

### ⚔️ 4 Archétypes / Classes
| Classe | Rôle | Spécialité | Couleur |
|--------|------|------------|---------|
| **Paladin** | Le Bâtisseur | Cadrage & Livrables | 🟡 Or |
| **Rôdeur** | L'Éclaireur | Défrichage Solo & Tech | 🟢 Émeraude |
| **Barde** | L'Idéateur | Pitch & Créativité | 🟣 Violet |
| **Alchimiste** | Le Finisseur | Rigueur UX & Débug | 🔵 Cyan |

### 📊 4 Attributs (1-5)
- **Mana Social** : Besoin de présence / vocal
- **Initiative** : Vitesse de démarrage
- **Canal Préféré** : Écrit ↔ Vocal
- **Tolérance aux Pivots** : Adaptabilité aux changements

### 📜 Grimoire de Survie
- **Don Ultime** (Zone de génie)
- **Kryptonite** (Malus critique)
- **Potion d'Apaisement** (Mode d'emploi)
- Snippets prédéfinis par catégorie

### 🏰 Hall de Guilde (Team Registry)
- Registre persistant en base (SQLite/PostgreSQL)
- Recherche temps réel + filtres par classe
- Cartes 3D miniatures, actions : Éditer, Dupliquer, Partager, Supprimer
- Mode "Légende" pour héros spéciaux

### 📱 PWA Complète
- Installable mobile/desktop (manifest + Service Worker)
- Offline-first (cache-first + background sync)
- Raccourcis : Forge / Guilde
- Responsive : Desktop 2 colonnes sticky, Mobile bottom nav + onglets

### 🎮 Expérience RPG
- Direction artistique "Manuscrit Doré" (or, parchemin, runes)
- Sons Web Audio : clics, équipement, dé, fanfare
- Radar chart interactif des stats
- **Dé du Destin** (randomisateur apparence seule)
- Protocole atelier 45 min intégré

### 💾 Persistance & Export
- Base de données SQLite (dev) / PostgreSQL (prod)
- Brouillon auto-sauvegardé (localStorage + sync)
- Export PNG 1080×1440 (carte HD)
- Copie Markdown pour Slack/Discord/Notion
- Partage natif (Web Share API) + fallback presse-papiers

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- Docker & Docker Compose (optionnel, pour prod)

### Développement Local
```bash
# Installation
npm install

# Démarrage (client + serveur en parallèle)
npm run dev

# Ou séparément :
npm run dev:client    # Vite sur http://localhost:5173
npm run dev:server    # Express sur http://localhost:3000
```

### Production avec Docker
```bash
# Build + démarrage
docker-compose up -d --build

# Logs
docker-compose logs -f

# Arrêt
docker-compose down
```

### Variables d'Environnement
Copier `.env.example` vers `.env` et configurer :
```env
NODE_ENV=production
PORT=3000
DATABASE_TYPE=sqlite          # ou postgres
SQLITE_PATH=./data/aetheria.db
CLIENT_URL=http://localhost:3000
SESSION_SECRET=your-secret-32-chars-min
JWT_SECRET=your-jwt-secret-32-chars
```

## 📁 Structure du Projet

```
aetheria/
├── client/                 # Frontend (Vite + Three.js)
│   ├── public/             # Assets statiques (manifest, sw, icons)
│   └── src/
│       ├── main.js         # Point d'entrée
│       ├── app.js          # Logique principale
│       ├── avatar3d.js     # Moteur 3D (Three.js)
│       ├── api.js          # Client API + offline
│       ├── data.js         # Données jeu partagées
│       └── styles/main.css # Styles complets
├── server/                 # Backend (Express)
│   ├── index.js            # Serveur + routes API
│   └── database.js         # SQLite + modèles
├── dist/                   # Build client (généré)
├── data/                   # SQLite DB (créé au runtime)
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Orchestration
├── package.json
└── README.md
```

## 🔧 API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/heroes` | Liste héros (filtres: classKey, guild, search, legendOnly, limit, offset) |
| GET | `/api/heroes/:id` | Détail héros |
| POST | `/api/heroes` | Créer héros |
| PUT | `/api/heroes/:id` | Mettre à jour |
| DELETE | `/api/heroes/:id` | Supprimer |
| POST | `/api/heroes/:id/duplicate` | Dupliquer |
| GET | `/api/settings/:key` | Lecture setting |
| PUT | `/api/settings/:key` | Écriture setting |

## 🎯 Cas d'Usage

1. **Bootcamp / Hackathon** : Atelier 45 min "Forge ton héro" → Speed-dating Kryptonite/Potion → Pacte d'équipe
2. **Équipe Produit** : Fiches "Manuel d'utilisation" pour nouveaux membres
3. **Équipe Remote** : Partage async des préférences de travail
4. **Icebreaker** : Dé du Destin + discussion sur les résultats

## 🌐 Compatibilité

| Navigateur | Support |
|------------|---------|
| Chrome/Edge 100+ | ✅ Complet (WebGL2) |
| Firefox 95+ | ✅ Complet |
| Safari 15+ | ✅ Complet |
| Mobile Chrome/Safari | ✅ PWA + WebGL |

Fonctionne aussi en `file://` (sans Service Worker ni backend).

## 📜 Licence

MIT — Libre d'utilisation, modification, distribution.

## 🤝 Crédits

- **Moteur 3D** : [Three.js](https://threejs.org/) (MIT)
- **Polices** : Cinzel, Manrope, Cormorant Garamond (SIL OFL)
- **Icônes** : SVG custom + inspirées Font Awesome 6
- **Sons** : Web Audio API synthétique (pas d'assets externes)
- **Concept original** : `rpg_guild_builder_fiche_d_aventurier.html` (fichier source)

---

*Forgé avec ⚔️ pour les équipes qui veulent mieux travailler ensemble.*