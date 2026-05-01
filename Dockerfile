# ─── Stage 1: Build ───────────────────────────────────────────────────────────
# Full dev-deps image: runs the seed script, compiles TypeScript, and builds
# the React frontend with Vite.
FROM node:20-alpine AS builder
WORKDIR /workspace

# Install ALL dependencies (devDeps needed for tsx + tsc + vite)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Generate the 40 000-row Excel employee dataset
# npm workspaces sets cwd to backend/ when running the seed script,
# so the file lands at backend/data/employees.xlsx
RUN npm run seed

# Compile TypeScript backend (→ backend/dist/) and build React (→ frontend/dist/)
RUN npm run build

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app/backend

ENV NODE_ENV=production
# Azure App Service sets PORT automatically; default to 8080 for other hosts.
ENV PORT=8080

# Install production backend dependencies only (no devDeps, no frontend)
COPY backend/package.json ./
RUN npm install --omit=dev --ignore-scripts

# Compiled server
COPY --from=builder /workspace/backend/dist ./dist

# React static build — must land at ../../frontend/dist relative to this WORKDIR
# so that path.join(__dirname, '../../frontend/dist') in app.ts resolves correctly:
#   /app/backend/dist/app.js  →  __dirname = /app/backend/dist
#   path.join(…, '../../frontend/dist') = /app/frontend/dist  ✓
COPY --from=builder /workspace/frontend/dist /app/frontend/dist

# Seeded employee data
COPY --from=builder /workspace/backend/data ./data

EXPOSE 8080

CMD ["node", "dist/index.js"]
