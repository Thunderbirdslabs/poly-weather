# Poly Weather — Trading Strategy Dashboard

Weather-Based Prediction Trading Strategy monitor. Tracks 50-trade test window, accuracy trends, P&L, data sources, and upcoming events.

**Stack:** React · Express · Vite · Tailwind CSS · shadcn/ui · Recharts · TypeScript

---

## Running with Docker (recommended)

### Development — hot reload

Every file save is reflected instantly (Vite HMR + tsx).

```bash
npm run docker:dev
# or directly:
docker compose -f docker-compose.dev.yml up --build
```

Open → http://localhost:5000

Stop:
```bash
npm run docker:dev:down
```

---

### Production

Builds an optimized multi-stage image and serves the compiled output.

```bash
npm run docker:prod
# or directly:
docker compose up --build
```

Open → http://localhost:5000

Stop:
```bash
npm run docker:prod:down
```

---

### Build image only (no compose)

```bash
npm run docker:build
# Run it:
docker run -p 5000:5000 -e DOCKER=true poly-weather
```

---

## Running natively on macOS (without Docker)

```bash
npm install
npm run dev
```

Open → http://localhost:5000

> **Note:** `npm run dev` works on macOS without Docker — `reusePort` and `0.0.0.0` binding issues are handled automatically via the `DOCKER` env variable.

---

## Project structure

```
poly-weather/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── pages/       # Dashboard, Trades, Reviews, Events, DataSources, Settings
│       ├── components/  # AppShell, ThemeProvider, shadcn/ui components
│       └── index.css    # Design tokens + Tailwind
├── server/              # Express backend
│   ├── index.ts         # Entry point
│   ├── routes.ts        # All API routes
│   └── storage.ts       # In-memory storage (seeded with sample data)
├── shared/
│   └── schema.ts        # Drizzle ORM schema + Zod types (shared FE/BE)
├── Dockerfile           # Multi-stage production image
├── Dockerfile.dev       # Development image (hot-reload)
├── docker-compose.yml   # Production compose
└── docker-compose.dev.yml  # Development compose
```

---

## Docker commands reference

| Command | What it does |
|---|---|
| `npm run docker:dev` | Start dev server with hot-reload in Docker |
| `npm run docker:dev:down` | Stop dev containers |
| `npm run docker:prod` | Build + start production container |
| `npm run docker:prod:down` | Stop prod containers |
| `npm run docker:build` | Build production image only |

---

## Environment variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port the server listens on |
| `NODE_ENV` | `development` | `development` or `production` |
| `DOCKER` | `false` | Set to `true` inside containers — enables `0.0.0.0` binding |
