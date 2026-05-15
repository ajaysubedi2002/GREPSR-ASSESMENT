# TASK 07 — URL Routing

## Goal
Wire all URL patterns so every endpoint is reachable at the correct path.

---

## Files to Create / Modify

1. **`backend/shortener/urls.py`** — API routes (new file)
2. **`backend/shortener/redirect_urls.py`** — redirect route (new file)
3. **`backend/config/urls.py`** — root router (replace auto-generated content)

---

## File 1 — `backend/shortener/urls.py`

```python
from django.urls import path
from .views import ShortenURLView, URLListView, URLDetailView, URLAnalyticsView

app_name = 'shortener'

urlpatterns = [
    path('shorten/', ShortenURLView.as_view(), name='shorten'),
    path('urls/', URLListView.as_view(), name='url-list'),
    path('urls/<str:alias>/', URLDetailView.as_view(), name='url-detail'),
    path('urls/<str:alias>/analytics/', URLAnalyticsView.as_view(), name='url-analytics'),
]
```

---

## File 2 — `backend/shortener/redirect_urls.py`

```python
from django.urls import path
from .redirect_views import RedirectView

urlpatterns = [
    path('<str:alias>/', RedirectView.as_view(), name='redirect'),
]
```

---

## File 3 — `backend/config/urls.py`

```python
from django.urls import path, include

urlpatterns = [
    path('api/', include('shortener.urls')),
    path('', include('shortener.redirect_urls')),
]
```

> **No `admin/` route is needed.** The assessment does not require the Django admin.
> Removing it keeps the URL namespace clean.

---

## Final URL Map

| Method | Full Path | View |
|--------|-----------|------|
| POST | `/api/shorten/` | `ShortenURLView` |
| GET | `/api/urls/` | `URLListView` |
| GET | `/api/urls/<alias>/` | `URLDetailView` |
| GET | `/api/urls/<alias>/analytics/` | `URLAnalyticsView` |
| GET | `/<alias>/` | `RedirectView` |

---

## Acceptance Criteria

- [ ] `POST http://localhost:8000/api/shorten/` is routable
- [ ] `GET http://localhost:8000/api/urls/` is routable
- [ ] `GET http://localhost:8000/api/urls/abc123/` is routable
- [ ] `GET http://localhost:8000/api/urls/abc123/analytics/` is routable
- [ ] `GET http://localhost:8000/abc123/` triggers the redirect view
- [ ] `python manage.py show_urls` (if django-extensions installed) lists all 5 routes
- [ ] `python manage.py check` passes with 0 errors

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `/api/urls/abc123/analytics/` matches detail view instead | Analytics pattern must come BEFORE detail in `urlpatterns` list |
| Redirect route `/<alias>/` catches `/api/` requests | The `api/` include must be listed BEFORE the redirect include in root `urls.py` |
| `NoReverseMatch` error | Check `app_name` matches the `include()` namespace if used |
