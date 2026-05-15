# TASK 10 — Dockerfile & docker-compose

## Goal
Containerise the Django backend so the reviewer can run the entire project
with a single `docker-compose up --build` command.

---

## Files to Create

1. **`backend/Dockerfile`**
2. **`docker-compose.yml`** (at repo root, next to the `backend/` folder)

---

## File 1 — `backend/Dockerfile`

```dockerfile
# Base image — slim Python 3.11 for a small final image
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (cached layer — only rebuilds when requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source
COPY . .

# Apply database migrations at container start
RUN python manage.py migrate --no-input

# Expose the development server port
EXPOSE 8000

# Start Django's development server, binding to all interfaces
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

---

## File 2 — `docker-compose.yml` (repo root)

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      # Mount source for live-reload during development
      - ./backend:/app
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings
    restart: unless-stopped
```

---

## How to Run

```bash
# From repo root
docker-compose up --build

# Verify it's running
curl http://localhost:8000/api/urls/
```

---

## Acceptance Criteria

- [ ] `docker-compose up --build` completes without errors
- [ ] `curl http://localhost:8000/api/urls/` returns `[]` or a list of URLs
- [ ] `curl -X POST http://localhost:8000/api/shorten/ -H "Content-Type: application/json" -d '{"url":"https://example.com"}'` returns 201
- [ ] The SQLite database file persists inside the container (acceptable for dev)
- [ ] The container restarts automatically if it crashes (`restart: unless-stopped`)

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `migrate` fails during build | Ensure `db.sqlite3` is writable inside the container |
| Port 8000 already in use | Stop local Django server before running Docker |
| Volume mount overwrites the pip-installed packages | Move packages to a non-mounted location or use a named volume for site-packages |
| `DJANGO_SETTINGS_MODULE` not found | Confirm the env var matches `config.settings` |
