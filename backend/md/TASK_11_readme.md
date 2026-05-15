# TASK 11 — README.md

## Goal
Write the project README. It is a graded deliverable — the reviewer reads it
before running a single command. It must cover: how to run, how the rate limiter
works, and the project structure.

---

## File to Create

**`README.md`** at the repository root.

---

## Full File Content

```markdown
# URL Shortener with Analytics

A Django REST Framework backend that shortens URLs, tracks clicks with
timestamps, and enforces per-IP rate limiting using a custom Fixed Window
algorithm. Paired with a React analytics dashboard (see `/frontend`).

---

## Quick Start

### Option A — Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener

# Build and start
docker-compose up --build
```

API available at **http://localhost:8000**

---

### Option B — Local Python

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

API available at **http://localhost:8000**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/shorten/` | Shorten a URL (rate-limited: 5/min per IP) |
| `GET` | `/api/urls/` | List all shortened URLs |
| `GET` | `/api/urls/<alias>/` | Detail + click count for one alias |
| `GET` | `/api/urls/<alias>/analytics/` | Daily clicks over the last 7 days |
| `GET` | `/<alias>/` | Redirect to original URL + record click |

Full request/response examples are in `API_DOCS.md`.

---

## Rate Limiter — Implementation

The rate limiter lives in `backend/shortener/rate_limiter.py`. No third-party
library is used — it is implemented from scratch using the **Fixed Window**
algorithm.

### How it works

Each IP address has one row in the `RateLimitEntry` database table:

| Field | Type | Purpose |
|-------|------|---------|
| `ip_address` | string | Primary lookup key (unique) |
| `window_start` | float | Unix timestamp when the current window started |
| `request_count` | int | Requests made in this window |

On every `POST /api/shorten/` request:

1. The client IP is extracted (honouring `X-Forwarded-For` for proxies).
2. The `RateLimitEntry` row is fetched with `SELECT FOR UPDATE` inside a
   `transaction.atomic()` block to prevent race conditions.
3. `elapsed = now - window_start` is computed.
4. **If `elapsed >= 60s`** — the window has expired. Reset `window_start = now`
   and `request_count = 1`. Allow the request.
5. **If `request_count >= 5`** — limit reached. Return HTTP 429 with
   `retry_after_seconds = ceil(60 - elapsed)`.
6. **Otherwise** — increment `request_count` and allow the request.

### Why Fixed Window?

Fixed Window is O(1) per check and requires no background cleanup process.
The only trade-off is a potential burst at window boundaries (up to 10 requests
in a short time if a client fires 5 just before the reset and 5 just after),
which is acceptable for a URL-shortening service.

### 429 Response Shape

```json
{
  "error": "Rate limit exceeded.",
  "retry_after_seconds": 42,
  "message": "You can shorten up to 5 URLs per minute. Please wait 42 second(s)."
}
```

The `Retry-After: 42` HTTP header is also included.

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── config/
│   │   ├── settings.py        Django settings + rate-limiter constants
│   │   └── urls.py            Root URL router
│   ├── shortener/
│   │   ├── migrations/        Auto-generated DB migrations
│   │   ├── models.py          ShortenedURL, Click, RateLimitEntry
│   │   ├── rate_limiter.py    Custom Fixed Window rate limiter
│   │   ├── serializers.py     DRF request/response serializers
│   │   ├── views.py           API views (shorten, list, detail, analytics)
│   │   ├── redirect_views.py  /{alias}/ redirect + click tracking
│   │   ├── urls.py            /api/ route definitions
│   │   └── redirect_urls.py   /{alias}/ route definition
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                  React app (see frontend/README.md)
├── docker-compose.yml
└── README.md
```

---

## Configuration

| Setting | Default | File |
|---------|---------|------|
| `RATE_LIMIT_MAX_REQUESTS` | 5 | `config/settings.py` |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | `config/settings.py` |
| `CORS_ALLOW_ALL_ORIGINS` | `True` | `config/settings.py` |
| Database | SQLite (`db.sqlite3`) | `config/settings.py` |
```

---

## Acceptance Criteria

- [ ] README exists at repo root as `README.md`
- [ ] Docker run instructions work copy-paste with no prior knowledge
- [ ] Local Python run instructions include virtualenv activation step
- [ ] Rate limiter section explains the algorithm (Fixed Window), not just the result
- [ ] The 429 response shape is shown
- [ ] Project structure tree is present
- [ ] No placeholder text like "TODO" or "coming soon" remains

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| Docker instructions assume image is pre-built | Include `--build` flag in `docker-compose up` |
| Rate limiter section says "we used X library" | It is a custom implementation — make that explicit |
| Missing `source .venv/bin/activate` step | Reviewers on macOS/Linux will hit `pip: command not found` without it |
