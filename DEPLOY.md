# Déploiement en production — Aetheria

Aetheria est **une seule application Node.js** qui sert à la fois :

- le front PWA compilé (`dist/`)
- l'API REST (`/api/*`)
- la base SQLite persistée dans un fichier (`data/aetheria.db`)

> **Important** : l'app et la base doivent tourner sur la même instance, avec un **disque persistant**. Les hébergeurs 100 % statiques (Vercel, Netlify, GitHub Pages) ne conviennent pas au backend.

---

## Déploiement actuel (Railway)

- **URL** : https://aetheria-production-af30.up.railway.app
- **Projet** : `aetheria`
- **Service** : `aetheria`
- **Volume** : `aetheria-volume` monté sur `/app/data`
- **Base** : `/app/data/aetheria.db` (persistante, testée après redéploiement)
- **Santé** : `/api/health` → `200`
- **HTTPS** : fourni par Railway

Pour redéployer après une modification :

```bash
railway up --service aetheria
```

Pour ajouter un domaine personnalisé :

```bash
railway domain aetheria.mondomaine.fr --service aetheria
# puis créer l'enregistrement DNS demandé (CNAME)
```

---

## 1. Vérifier le build en local

```bash
npm ci
npm run build
npm start
# → http://localhost:3000
```

Le serveur sert `dist/` et crée `data/aetheria.db` au premier démarrage (avec le roster de démo).

---

## 2. Option recommandée : VPS + Docker + HTTPS

Idéal pour un vrai nom de domaine, un coût fixe et un contrôle total.

### Prérequis
- Un VPS Ubuntu/Debian (1 Go RAM suffit)
- Docker + Docker Compose
- Un domaine (ex. `aetheria.mondomaine.fr`) avec un enregistrement DNS **A** vers l'IP du VPS

### Installation sur le serveur

```bash
ssh user@IP_DU_VPS

# Docker
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# Récupérer le projet (git clone ou rsync)
git clone <URL_DU_REPO> aetheria
cd aetheria

# Lancer l'app + le proxy HTTPS
DOMAIN=aetheria.mondomaine.fr docker compose --profile tls up -d --build
```

Caddy obtient automatiquement le certificat Let's Encrypt. L'app est disponible sur :

```
https://aetheria.mondomaine.fr
```

### Sans nom de domaine (test par IP)

```bash
docker compose up -d --build
# → http://IP_DU_VPS:3000
```

Pense à ouvrir le port 3000 (ou 80/443 avec Caddy) dans le pare-feu :

```bash
sudo ufw allow 80,443/tcp
# ou pour un test direct :
sudo ufw allow 3000/tcp
```

### Mise à jour

```bash
git pull
docker compose up -d --build
```

### Sauvegarde de la base

```bash
# Copier la base hors du conteneur
docker compose cp app:/app/data/aetheria.db ./backup-$(date +%F).db

# Restaurer
docker compose cp ./backup-2026-11-08.db app:/app/data/aetheria.db
docker compose restart app
```

### Restaurer le roster actuel de ton poste

Si tu veux conserver les héros déjà créés en local, copie `data/aetheria.db` vers le serveur :

```bash
scp data/aetheria.db user@IP_DU_VPS:~/aetheria/data/
```

Puis redémarre : `docker compose restart app`.

---

## 3. Option Render (managée, sans serveur à gérer)

Render sait construire le `Dockerfile` et monter un disque persistant.

1. Pousser le projet sur GitHub.
2. Render → **New → Web Service** → sélectionner le dépôt.
3. Runtime : **Docker**. Plan : **Starter** (un disque persistant est requis).
4. Ajouter un **Disk** :
   - Name : `aetheria-data`
   - Mount Path : `/app/data`
   - Size : `1 GB`
5. Variables d'environnement :

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `SQLITE_PATH` | `/app/data/aetheria.db` |
| `DATABASE_TYPE` | `sqlite` |

`PORT` est injecté automatiquement par Render — ne pas le fixer.

6. Health check path : `/api/health`.
7. Déployer. Chaque redéploiement conserve le disque et donc la base.

> Un `render.yaml` peut aussi être ajouté pour versionner cette configuration.

---

## 4. Option Railway (choisie)

Railway construit automatiquement le `Dockerfile`, fournit le HTTPS et permet de monter un **volume persistant** pour SQLite.

### 4.1 Déploiement via la CLI (sans dépôt GitHub)

```bash
# 1. Installer la CLI Railway
npm i -g @railway/cli

# 2. Se connecter (ouvre le navigateur)
railway login

# 3. Depuis le dossier du projet : créer le projet + service et déployer
railway up -y --new --name aetheria
```

Ensuite, dans le dashboard Railway du projet :

1. **Volume** : `+ New` → **Volume** → l'attacher au service `aetheria`.
   - Mount path : **`/app/data`** (obligatoire, c'est là que vit `aetheria.db`).
2. **Variables** (onglet Variables) :

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_TYPE` | `sqlite` |
| `SQLITE_PATH` | `/app/data/aetheria.db` |
| `RAILWAY_RUN_UID` | `0` |

> `RAILWAY_RUN_UID=0` est nécessaire car Railway monte les volumes en `root` et l'image tourne avec l'utilisateur `node`. Sans cela, l'écriture de la base échoue.
>
> Ne fixe pas `PORT` : Railway l'injecte automatiquement et le serveur l'utilise déjà.

3. **Réseau** : Settings → Networking → **Generate Domain**.
   L'URL `https://aetheria-production.up.railway.app` (ou similaire) sert l'app **et** l'API.

4. **Healthcheck** : configuré sur le service Railway → chemin **`/api/health`**, timeout 120 s, redémarrage automatique (`ON_FAILURE`, 10 tentatives). Modifiable dans le dashboard : Settings → Healthcheck.

Chaque `railway up` (ou redéploiement) conserve le volume et donc la base.

### 4.2 Sauvegarde / restauration de la base sur Railway

```bash
# Télécharger la base
railway volume files download /aetheria.db ./backup-aetheria.db

# Restaurer (écrase la base distante)
railway volume files upload ./backup-aetheria.db /aetheria.db --overwrite

# Redémarrer le service après restauration
railway redeploy
```

### 4.3 Déploiement via GitHub (alternative)

1. Pousser le projet sur GitHub.
2. Railway → **New Project → Deploy from GitHub repo**.
3. Railway détecte le `Dockerfile` et construit l'image.
4. Ajouter le volume `/app/data`, les variables ci-dessus, puis générer un domaine.

---

## 5. Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `NODE_ENV` | `production` | Sert `dist/` automatiquement |
| `PORT` | `3000` | Port HTTP (injecté par certains hébergeurs) |
| `DATABASE_TYPE` | `sqlite` | Type de base |
| `SQLITE_PATH` | `./data/aetheria.db` | Emplacement du fichier SQLite |
| `CLIENT_URL` | `http://localhost:5173` | URL du client en dev |

Aucun secret n'est nécessaire aujourd'hui (API publique, sans authentification).

---

## 6. Checklist avant mise en ligne

- [ ] `npm run build` passe sans erreur
- [ ] `npm start` sert bien l'app et `/api/health` répond `200`
- [ ] Un disque persistant est monté sur le dossier de la base
- [ ] HTTPS actif (Caddy, Render ou Railway)
- [ ] Sauvegarde de `aetheria.db` prévue
- [ ] Le service worker est bien servi en HTTPS (obligatoire pour l'installation PWA)

---

## 7. LLM sécurisé (proxy serveur)

Le mode **Serveur sécurisé** du Donjon ne stocke aucune clé LLM dans le navigateur : le serveur appelle le fournisseur avec ses propres variables d’environnement.

### Variables Railway

| Clé | Rôle |
|---|---|
| `LLM_PROVIDER` | `openai`, `openrouter`, `anthropic` ou `ollama` |
| `LLM_MODEL` | Modèle (ex. `gpt-4o-mini`, `claude-3-5-haiku-latest`) |
| `LLM_API_KEY` | Clé du fournisseur — ou `OPENAI_API_KEY` / `OPENROUTER_API_KEY` / `ANTHROPIC_API_KEY` |
| `LLM_BASE_URL` | Endpoint personnalisé / Ollama |
| `LLM_MAX_TOKENS` | Limite de génération (défaut 2200) |
| `LLM_TIMEOUT_MS` | Timeout serveur (défaut 60000) |
| `LLM_RATE_LIMIT_PER_HOUR` | Limite par IP (défaut 12) |
| `LLM_GLOBAL_LIMIT_PER_HOUR` | Limite globale (défaut 60) |
| `LLM_MAX_CONCURRENT` | Appels simultanés (défaut 2) |
| `LLM_ACCESS_CODE` | Optionnel : code d’accès demandé dans l’interface |

La clé se configure **uniquement dans Railway** (onglet Variables du service), jamais dans le dépôt ni dans le client. Un redémarrage du service est automatique après modification des variables.

### Endpoints

- `GET /api/llm/status` : état public du proxy (fournisseur, modèle, limites, code requis) — **aucun secret**.
- `POST /api/llm/campaign` : génération serveur. Même origine obligatoire, validation des entrées, limitation par IP et globale, timeout.

### Vérification

```bash
curl https://aetheria-staging.up.railway.app/api/llm/status
# {"configured":true,"provider":"openai", ...}
```

Tant que `configured` vaut `false`, l’interface affiche « Serveur non configuré » et le mode Démo reste disponible.

---

## 8. Limites connues

- **SQLite = une seule instance.** Pour du multi-instance ou une charge élevée, migrer vers PostgreSQL (dépendance `pg` déjà présente, adaptateur à écrire dans `server/database.js`).
- La base est sauvegardée sur disque toutes les 5 secondes et à l'arrêt du serveur.
- Les fichiers `server/sql-wasm.wasm` et `server/sql-wasm.js` sont nécessaires au runtime et sont inclus dans l'image Docker.
