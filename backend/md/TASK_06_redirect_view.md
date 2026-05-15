# TASK 06 — Redirect View & Click Tracking

## Goal
Implement the `/{alias}/` redirect endpoint in `shortener/redirect_views.py`.
This is a plain Django view (not DRF) because it issues a 302 redirect, not JSON.

---

## File to Create

**`backend/shortener/redirect_views.py`**

---

## Full File Content

```python
"""
redirect_views.py
-----------------
Handles GET /{alias}/ — redirects the visitor to the original URL
and records a Click event with the current timestamp.

This is a standard Django view (not DRF) because the response is an
HTTP redirect, not a JSON payload.
"""

from django.http import HttpRequest, JsonResponse
from django.shortcuts import redirect
from django.views import View

from .models import Click, ShortenedURL
from .rate_limiter import get_client_ip


class RedirectView(View):
    """
    GET /{alias}/

    Behaviour:
      1. Look up the alias in the database.
      2. If not found, return 404 JSON.
      3. Record a Click row with timestamp and visitor IP.
      4. Return HTTP 302 redirect to the original URL.

    Note: The click is recorded BEFORE the redirect so it is not lost
    if the redirect target is unreachable.
    """

    def get(self, request: HttpRequest, alias: str):
        try:
            url = ShortenedURL.objects.get(alias=alias)
        except ShortenedURL.DoesNotExist:
            return JsonResponse(
                {'error': f"Short URL '{alias}' not found."},
                status=404,
            )

        # Record the click ────────────────────────────────────────────────────
        Click.objects.create(
            shortened_url=url,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return redirect(url.original_url, permanent=False)   # HTTP 302
```

---

## Behaviour Detail

| Scenario | Response |
|----------|----------|
| Valid alias | 302 redirect to `original_url`, Click row created |
| Unknown alias | 404 JSON `{ "error": "Short URL 'xyz' not found." }` |

---

## Acceptance Criteria

- [ ] `GET /abc123/` with a valid alias returns **302** and sets the `Location` header to the original URL
- [ ] A `Click` row is inserted in the database on every successful redirect
- [ ] The `Click.clicked_at` timestamp is set automatically by Django (`auto_now_add=True`)
- [ ] `GET /badAlias/` returns **404** with a JSON body (not an HTML Django error page)
- [ ] `get_client_ip()` is reused from `rate_limiter.py` — do not duplicate it

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| Returns an HTML 404 page instead of JSON | Use `JsonResponse` not `Http404` |
| `permanent=True` sends 301 (browser caches it) | Always use `permanent=False` for a trackable redirect |
| Click not recorded when original URL is slow | Create the Click BEFORE calling `redirect()` |
| `get_client_ip` duplicated in this file | Import it from `.rate_limiter` instead |
