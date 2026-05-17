# Grepsr Assessment

Lightweight URL shortener built with Django REST Framework, Redis rate limiting, PostgreSQL persistence, and a React + Vite frontend served by Nginx.

## Features

- Shorten and expand URLs via a REST API
- Rate limiting using Redis
- Persistent storage in PostgreSQL
- SPA frontend with Vite and React
- Containerized with Docker Compose for easy local development

## Quick start (Docker)

### Prerequisites

- Docker and Docker Compose

### Run the stack

```bash
docker compose up --build
```

Accessible services (default ports):

- Frontend: http://localhost:5173
- Backend API (Swagger): http://localhost:8000/api/schema/swagger-ui/
- PostgreSQL: localhost:5432 (service name: postgres)
- Redis: localhost:6379 (service name: redis)

### First-time setup

Database migrations run automatically when the stack starts. To create a superuser (optional):

```bash
docker compose exec backend python manage.py createsuperuser
```

### Stop and clean up

```bash
docker compose down
docker compose down -v  # remove volumes (database data)
```

## Configuration / Environment

The backend reads environment variables from `backend/config/.env`. Docker Compose also injects service hostnames so containers can reach each other (for example, `DB_HOST=postgres`, `REDIS_HOST=redis`).

Do not commit secrets into the repository. Example (sanitized) `.env` entries:

```env
# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Django
SECRET_KEY="your-secret-key-here"
ALLOWED_HOSTS=127.0.0.1,localhost

# Postgres (used by Django)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=grepsr
DB_USER=grepsr
DB_PASSWORD=grepsr
DB_HOST=postgres
DB_PORT=5432

# Postgres (for docker service)
POSTGRES_DB=grepsr
POSTGRES_USER=grepsr
POSTGRES_PASSWORD=grepsr
```

If you change environment values, restart the stack:

```bash
docker compose up --build
```

## Local development (without Docker)

- Backend:
	- Create and activate a Python virtual environment
	- Install dependencies: `pip install -r backend/requirements.txt`
	- Provide `backend/config/.env` and run migrations
	- Start server: `python backend/manage.py runserver`
- Frontend:
	- From `frontend/`: `npm install` and `npm run dev`

## Tests

To run backend checks and tests (from project root or inside the backend container):

```bash
# using local venv
python backend/manage.py test

# or inside the container
docker compose exec backend python manage.py test
```

## Project layout

- `backend/` — Django project and API
- `frontend/` — React + Vite SPA
- `docker-compose.yml` — orchestrates containers (backend, frontend, postgres, redis)

## Useful commands

- Build & run: `docker compose up --build`
- Run migrations: `docker compose exec backend python manage.py migrate`
- Create superuser: `docker compose exec backend python manage.py createsuperuser`
- Stop: `docker compose down`

## Contributing

PRs, issues and improvements welcome. For small fixes, open a branch named `fix/*` or `feat/*` and submit a pull request.

## License

This repository does not include a license. Add one if you plan to publish or share the project.

---

If you want, I can also:

- add badges and CI examples
- add a short API usage section with example curl requests
- split the README into CONTRIBUTING.md and DEVELOPMENT.md

 