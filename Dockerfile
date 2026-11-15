# syntax=docker/dockerfile:1
# Aetheria — multi-stage production image (client build + Node API + SQLite)

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies from the lockfile
COPY package*.json ./
RUN npm ci

# Copy the project and build the PWA
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_TYPE=sqlite \
    SQLITE_PATH=/app/data/aetheria.db

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Built PWA + API (server/ contains sql-wasm.wasm)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Persistent data directory, writable by the non-root node user
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server/index.js"]
