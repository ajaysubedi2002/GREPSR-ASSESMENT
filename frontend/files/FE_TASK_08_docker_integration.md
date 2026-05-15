# FE TASK 08 — Docker Integration

## Goal
Containerise the React frontend using a two-stage Docker build (Vite build →
Nginx serve). Then update `docker-compose.yml` at the repo root so that a single
`docker-compose up --build` starts both the backend (Django) and the frontend
(Nginx) together.

---

## Files to Create / Modify

1. **`frontend/Dockerfile`** — new file
2. **`frontend/nginx.conf`** — new file (Nginx config for React SPA)
3. **`docker-compose.yml`** (repo root) — add the frontend service

---

## File 1 — `frontend/Dockerfile`

```dockerfile
# ── Stage 1: Build the React app with Vite ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache — only busts when package.json changes)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output: /app/dist/


# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the Vite build output from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## File 2 — `frontend/nginx.conf`

This config handles React client-side routing correctly (all unknown paths
fall back to `index.html` so React Router can take over).

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Serve static assets with long cache headers
    location ~* \.(js|css|png|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # All other routes → index.html (React SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1024;
}
```

---

## File 3 — `docker-compose.yml` (full updated file — repo root)

Replace the existing file entirely with this version that includes both services:

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
      - ./backend:/app
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

> **Note on API URL in Docker:** When running both services in Docker, the frontend
> container serves from port 3000 and the backend is on port 8000 of the **host** machine.
> The `BASE_URL` in `src/api/api.js` should remain `http://localhost:8000` — the browser
> makes requests to the host, not through the Docker network.

---

## How to Run (both services)

```bash
# From repo root
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

---

## Acceptance Criteria

- [ ] `frontend/Dockerfile` uses a two-stage build (node builder → nginx server)
- [ ] `frontend/nginx.conf` exists with the SPA fallback (`try_files $uri /index.html`)
- [ ] `docker-compose up --build` starts both services without errors
- [ ] `http://localhost:3000` serves the React app
- [ ] `http://localhost:8000/api/urls/` still responds with JSON
- [ ] The frontend app can call the backend API from the browser (no CORS errors)
- [ ] `npm run build` output (`dist/`) is NOT committed to git (add to `.gitignore`)

---

## .gitignore additions

Add these lines to `frontend/.gitignore` (Vite creates this file automatically):

```
dist/
node_modules/
```

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `npm ci` fails — no `package-lock.json` | Run `npm install` locally first to generate `package-lock.json`, then rebuild |
| Nginx shows 404 on page refresh | The `try_files $uri $uri/ /index.html` directive is missing or wrong |
| CORS error in Dockerised frontend | Django `CORS_ALLOW_ALL_ORIGINS = True` in settings; backend must be reachable on port 8000 |
| `dist/` folder not found in Stage 2 | Confirm `COPY --from=builder /app/dist` matches Vite's default output directory |
| Port 3000 already in use | Change the host port mapping to `"3001:80"` in docker-compose.yml |
