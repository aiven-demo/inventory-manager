# Recipe App Compose Demo

A simple recipe application with a Node.js backend, React frontend, and PostgreSQL database.

## Features

- 🍳 Recipe search and browsing
- 📱 Responsive design with Tailwind CSS
- 🔍 Real-time search functionality
- 📖 Detailed recipe pages with ingredients and instructions
- 🐳 Docker/Podman support
- ⚡ Fast builds with minimal dependencies

## Tech stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL
- **Container**: Docker/Podman

## Quick start

The easiest way to run the application is with Docker Compose or Podman Compose. This starts the backend, frontend, and a PostgreSQL database in one command.

### Prerequisites

- Docker or Podman with Compose

### Running

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd recipe-app-compose-demo
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
   - **Web app** (backend + frontend) on http://localhost:3000

   The database is automatically seeded with sample recipes on first launch.

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

All application code lives under `apps/web/`, which is an npm workspace with `backend` and `frontend` packages.

1. **Start the database**

   ```bash
   docker compose -f apps/docker-compose.yml up db -d
   ```

2. **Install dependencies**

   ```bash
   cd apps/web
   npm install
   ```

3. **Start the development servers**

   ```bash
   DATABASE_URL=postgresql://recipe_user:recipe_pass@localhost:5432/recipe_db npm run dev
   ```

   This starts:

   - Backend server on http://localhost:3001
   - Frontend dev server (Vite) on http://localhost:5173

   You can also run them individually with `npm run dev:backend` or `npm run dev:frontend`.

4. **Lint the frontend**

   ```bash
   cd frontend
   npm run lint
   ```

### Database seeding

The database is automatically seeded with sample recipes on first launch. To re-seed manually:

```bash
cd apps/web/backend
npm run db:seed
```

## API endpoints

- `GET /health` - Health check
- `GET /api/recipes` - Get all recipes (supports search query parameter)
- `GET /api/recipes/:id` - Get recipe by ID

## Environment variables

These are configured automatically when using Docker/Podman Compose. Only set them manually for local development.

| Variable | Description | Default (Compose) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) | `postgresql://recipe_user:recipe_pass@db:5432/recipe_db` |
| `SERVER_PORT` | Backend server port | `3000` |
| `FRONTEND_DEV_PORT` | Frontend dev server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

## License

MIT License
