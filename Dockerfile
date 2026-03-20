# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
#   Install ALL dependencies (including devDeps needed for the build step).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first so layer cache is reused when source changes but deps don't
COPY package.json package-lock.json ./

# Install all deps (dev + prod) — needed for build step
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
#   Compile the React frontend (Vite) and the Express server (esbuild).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source
COPY . .

# Build: runs tsx script/build.ts which calls vite build + esbuild
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner (production image)
#   Lean image — only the compiled output + prod node_modules.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DOCKER=true
ENV PORT=5000

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser \
  && chown -R appuser:nodejs /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/config || exit 1

CMD ["node", "dist/index.cjs"]
