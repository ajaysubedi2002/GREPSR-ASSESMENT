# TASK 08 — Django Settings

## Goal
Replace the auto-generated `config/settings.py` with a clean, assessment-ready
configuration that registers all apps, configures CORS, DRF, and the rate-limiter
constants.

---

## File to Replace

**`backend/config/settings.py`** — overwrite entirely.

---

## Full File Content

```python
"""
Django settings for the URL Shortener project.

For production use, move SECRET_KEY to an environment variable and
set DEBUG = False.
"""

from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ─────────────────────────────────────────────────────────────────
# IMPORTANT: Replace this with a real secret in production (use env var).
SECRET_KEY = 'django-insecure-replace-this-before-deploying-to-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

# ── Installed Apps ────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    # Django internals (contenttypes + auth needed for migrations)
    'django.contrib.contenttypes',
    'django.contrib.auth',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Local
    'shortener',
]

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # Must be first
    'django.middleware.common.CommonMiddleware',
]

# ── URL Configuration ─────────────────────────────────────────────────────────
ROOT_URLCONF = 'config.urls'

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow all origins in development so the React frontend can call the API.
# Restrict to specific origins in production.
CORS_ALLOW_ALL_ORIGINS = True

# ── Django REST Framework ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# ── Timezone ──────────────────────────────────────────────────────────────────
USE_TZ = True
TIME_ZONE = 'UTC'

# ── Primary Key ───────────────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Rate Limiter ──────────────────────────────────────────────────────────────
# These constants are read by shortener/rate_limiter.py.
# Change RATE_LIMIT_MAX_REQUESTS to adjust how many shortenings are
# allowed per IP per window.
RATE_LIMIT_MAX_REQUESTS = 5    # max requests per window
RATE_LIMIT_WINDOW_SECONDS = 60 # window duration in seconds
```

---

## Key Decisions

| Setting | Value | Reason |
|---------|-------|--------|
| `INSTALLED_APPS` | Minimal — no `django.contrib.admin` | Not needed for this API |
| `CORS_ALLOW_ALL_ORIGINS` | `True` | Dev only — React runs on a different port |
| `DEFAULT_RENDERER_CLASSES` | JSON only | API returns no HTML |
| `USE_TZ = True` | `True` | Required for correct analytics date filtering |
| `RATE_LIMIT_MAX_REQUESTS` | 5 | Matches the assessment constraint |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | One-minute window as specified |

---

## Acceptance Criteria

- [ ] `python manage.py check` passes with 0 errors
- [ ] `python manage.py migrate` runs without errors
- [ ] All apps in `INSTALLED_APPS` are importable
- [ ] `corsheaders.middleware.CorsMiddleware` is the **first** entry in `MIDDLEWARE`
- [ ] `USE_TZ = True` is set (required for date-aware analytics queries)

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: corsheaders` | Run `pip install -r requirements.txt` |
| Migration errors about `auth` tables | Keep `django.contrib.contenttypes` and `django.contrib.auth` in `INSTALLED_APPS` |
| `CorsMiddleware` not applying | It must be the FIRST item in `MIDDLEWARE` |
| Analytics returns wrong dates | Ensure `USE_TZ = True` and `TIME_ZONE = 'UTC'` are both set |
