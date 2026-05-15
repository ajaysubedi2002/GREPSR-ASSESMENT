# TASK 01 — Project Setup & Dependencies

## Goal
Scaffold the full Django project directory, create the virtual environment, and
install all required packages. No code logic in this task — structure only.

---

## Steps

### 1. Create the directory tree

```bash
mkdir -p url-shortener/backend
cd url-shortener/backend
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows
```

### 3. Create requirements.txt

Create the file `url-shortener/backend/requirements.txt` with exactly this content:

```
Django==4.2.13
djangorestframework==3.15.1
django-cors-headers==4.3.1
```

> Do NOT add flask-limiter, django-ratelimit, or any rate-limiting package.

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Scaffold the Django project

```bash
# Run from inside url-shortener/backend/
django-admin startproject config .
```

This creates:
```
backend/
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── manage.py
```

### 6. Create the shortener app

```bash
python manage.py startapp shortener
```

This creates:
```
backend/shortener/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   └── __init__.py
├── models.py
├── tests.py
└── views.py
```

### 7. Create additional files (empty for now)

```bash
touch shortener/serializers.py
touch shortener/rate_limiter.py
touch shortener/redirect_views.py
touch shortener/redirect_urls.py
```

---

## Acceptance Criteria

- [ ] `requirements.txt` exists and contains exactly the three packages listed
- [ ] `manage.py` exists at `backend/manage.py`
- [ ] `config/` directory contains `settings.py`, `urls.py`, `__init__.py`
- [ ] `shortener/` directory contains `__init__.py`, `models.py`, `views.py`,
      `serializers.py`, `rate_limiter.py`, `redirect_views.py`, `redirect_urls.py`
- [ ] `python manage.py check` exits with 0 errors (after TASK 08 settings are applied)

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `django-admin` not found | Activate the virtualenv first |
| `startproject config .` creates nested folder | The `.` at the end is required |
| `ModuleNotFoundError: No module named 'rest_framework'` | Run `pip install -r requirements.txt` |
