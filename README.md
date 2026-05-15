# Grepsr Assessment

URL shortener with Django REST API, Redis rate limiting, PostgreSQL storage, and a React + Vite frontend served by Nginx.

## Quick start (Docker)

### Prerequisites

- Docker + Docker Compose

### Run the stack

```bash
docker compose up --build
```

Services and ports:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/schema/swagger-ui/
- PostgreSQL: localhost:5432 (internal service name: `postgres`)
- Redis: localhost:6379 (internal service name: `redis`)

### First-time database setup

```bash
docker compose exec backend python manage.py migrate
```

(Optional) Create a Django superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

### Stop and clean up

```bash
docker compose down
```

To remove volumes (including the database data):

```bash
docker compose down -v
```

## Environment files

The backend uses a single env file:

- `backend/config/.env`

Docker Compose loads this file for both the `postgres` and `backend` services (see `docker-compose.yml`). The compose file also overrides some values at runtime:

- `DB_HOST` is set to `postgres`
- `REDIS_HOST` is set to `redis`

That lets the containers reach each other by service name even though the `.env` file contains localhost values for local development.

### Current .env contents

```env
SECRET_KEY=django-insecure-m*=+1e^oi@vqtma^v6mhz6207gq9bcn_y7daepx-82i0hsy*+0
ALLOWED_HOSTS=127.0.0.1,localhost

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_PREFIX=rate-limit

DB_ENGINE=django.db.backends.postgresql
DB_NAME=grepsr
DB_USER=grepsr
DB_PASSWORD=grepsr
DB_HOST=127.0.0.1
DB_PORT=5432

POSTGRES_DB=grepsr
POSTGRES_USER=grepsr
POSTGRES_PASSWORD=grepsr
```

If you change any values, rebuild or restart the services:

```bash
docker compose up --build
```

## Local (non-Docker) quick notes

If you prefer running locally:

- Backend: create a virtual env, install `backend/requirements.txt`, and set `backend/config/.env`.
- Frontend: run `npm install` in `frontend/` and `npm run dev`.
- Make sure PostgreSQL and Redis are running locally on the ports specified in the env file.
