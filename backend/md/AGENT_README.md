# Agent Task Suite — Grepsr URL Shortener Assessment

## Overview

This folder contains all task files an agent needs to complete the Grepsr full-stack
assessment. Each file is self-contained: it lists the exact goal, the inputs available,
the exact files to create or modify, the acceptance criteria, and common failure modes.

**Read this file first**, then execute tasks in the order below.

---

## Execution Order

```
1. TASK_01_project_setup.md          — scaffold folders, virtualenv, install deps
2. TASK_02_django_models.md          — ShortenedURL, Click, RateLimitEntry models
3. TASK_03_rate_limiter.md           — custom Fixed Window rate limiter (no library)
4. TASK_04_serializers.md            — DRF request/response serializers
5. TASK_05_api_views.md              — all four API views
6. TASK_06_redirect_view.md          — /{alias}/ redirect + click tracking
7. TASK_07_url_routing.md            — wire all URL patterns
8. TASK_08_django_settings.md        — settings, CORS, DRF config
9. TASK_09_migrations_and_run.md     — makemigrations, migrate, smoke test
10. TASK_10_dockerfile.md            — Dockerfile + docker-compose.yml
11. TASK_11_readme.md                — README.md with run guide + rate-limiter explanation
12. TASK_12_api_docs.md              — API documentation markdown
```

---

## Tech Stack

| Layer      | Choice                        |
|------------|-------------------------------|
| Backend    | Python 3.11, Django 4.2, DRF 3.15 |
| Database   | SQLite (dev), swap for Postgres in prod |
| Frontend   | React (separate repo — not in scope here) |
| Container  | Docker + docker-compose       |

---

## Repository Layout (final target)

```
url-shortener/
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── shortener/
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── 0001_initial.py
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── redirect_views.py
│   │   ├── rate_limiter.py
│   │   ├── urls.py
│   │   └── redirect_urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Global Rules for the Agent

1. **Never install flask-limiter, django-ratelimit, or any rate-limiting library.**
   The rate limiter must be implemented from scratch.
2. **Use Python type hints** on all function signatures.
3. **4-space indentation** in Python. 2-space in JS/JSX.
4. **snake_case** for Python variables and functions. **PascalCase** for classes.
5. Every view must return **JSON responses only** — no HTML from the API.
6. **All API routes** live under the `/api/` prefix.
7. The redirect route `/{alias}/` is **not** under `/api/`.
8. After every file is created, verify it with `python manage.py check`.
