# Inventory Manager

A multi-service demo application with a Node.js web backend, a React frontend, a PostgreSQL database, a Redis cache, a Redis queue, and a Go-based background job service.

## Architecture

```mermaid
flowchart LR
    User --> Web["Web (Node.js/React)"]
    Web -- CRUD --> PostgreSQL
    Web -- cache search results --> Cache["Cache (Redis)"]
    Web -- LPUSH job --> Queue["Queue (Redis)"]
    Queue --> Analyzer["cost-analyzer (Go)"]
    Analyzer --> PostgreSQL
```

- **Web**: Node.js + Express backend serving a React frontend. Handles inventory item CRUD, caches search results in Redis, and enqueues cost analysis jobs to Redis.
- **cost-analyzer**: Go worker that polls a Redis list for jobs, analyzes item components to estimate cost metrics (unit cost, weight, volume, shipping, handling time), and writes results to PostgreSQL.
- **Redis**: Used as a job queue (between web and analyzer) and a cache (for item search results).
- **PostgreSQL**: Primary data store for inventory items and cost metrics.

## Features

- Inventory item search and browsing
- Dashboard with KPI cards and interactive charts (Recharts)
- Responsive design with Tailwind CSS
- Real-time search functionality
- Detailed item pages with components and handling procedures
- Pin/unpin items for quick access
- Cost analysis (async, powered by Go worker via Redis queue)
- Search result caching via Redis
- Docker/Podman support

## Tech stack

- **Web backend**: Node.js, Express, PostgreSQL, ioredis
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Cost analyzer**: Go, go-redis, pgx
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Container**: Docker/Podman

## Quick start

The easiest way to run the application is with Docker Compose or Podman Compose. This starts all services in one command.

### Prerequisites

- Docker or Podman with Compose

### Running

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd inventory-manager
   ```

2. **Start all services**

   Using Docker Compose:

   ```bash
   docker compose -f apps/docker-compose.yml up --build -d
   ```

   Using Podman Compose:

   ```bash
   podman-compose -f apps/docker-compose.yml up --build -d
   ```

   This starts:

   - **PostgreSQL** database on port 5432
   - **Redis** on port 6379
   - **Web app** (backend + frontend) on http://localhost:3000
   - **Cost analyzer** (Go worker)

   The database is automatically seeded with sample inventory items on first launch.

3. **View logs**

   ```bash
   docker compose -f apps/docker-compose.yml logs -f
   ```

   Or with Podman:

   ```bash
   podman-compose -f apps/docker-compose.yml logs -f
   ```

4. **Stop all services**

   ```bash
   docker compose -f apps/docker-compose.yml down
   ```

   To also remove the database volume (resets all data):

   ```bash
   docker compose -f apps/docker-compose.yml down -v
   ```

## Development

All application code lives under `apps/web/` (npm workspace with `backend` and `frontend` packages) and `apps/cost-analyzer/` (Go module).

1. **Start the database and Redis**

   ```bash
   docker compose -f apps/docker-compose.yml up db redis -d
   ```

2. **Install dependencies**

   ```bash
   cd apps/web
   npm install
   ```

3. **Start the development servers**

   ```bash
   DATABASE_URL=postgresql://inma_user:inma_pass@localhost:5432/inma_db CACHE_REDIS_URL=redis://localhost:6379 QUEUE_REDIS_URL=redis://localhost:6380 npm run dev
   ```

   This starts:

   - Backend server on http://localhost:3001
   - Frontend dev server (Vite) on http://localhost:5173

   You can also run them individually with `npm run dev:backend` or `npm run dev:frontend`.

4. **Run the cost analyzer locally** (requires Go 1.23+)

   ```bash
   cd apps/cost-analyzer
   DATABASE_URL=postgresql://inma_user:inma_pass@localhost:5432/inma_db QUEUE_REDIS_URL=redis://localhost:6380 go run .
   ```

### Database seeding

The database is automatically seeded with sample inventory items on first launch. To re-seed manually:

```bash
cd apps/web/backend
npm run db:seed
```

## API endpoints

- `GET /health` - Health check
- `GET /api/items` - Get all items (supports `search`, `limit`, `offset` query parameters)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items/:id/pin` - Pin an item
- `POST /api/items/:id/unpin` - Unpin an item
- `POST /api/items/:id/analyze` - Enqueue cost analysis (via queue -> Go worker)
- `GET /api/items/:id/metrics` - Get cost metrics for an item

## Environment variables

These are configured automatically when using Docker/Podman Compose. Only set them manually for local development.

| Variable | Description | Default (Compose) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) | `postgresql://inma_user:inma_pass@inma-db:5432/inma_db` |
| `CACHE_REDIS_URL` | Redis URL for caching (web only) | `redis://inma-web-cache:6379` |
| `QUEUE_REDIS_URL` | Redis URL for job queue | `redis://inma-queue:6379` |
| `SERVER_PORT` | Backend server port | `3000` |
| `FRONTEND_DEV_PORT` | Frontend dev server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

## License

MIT License
