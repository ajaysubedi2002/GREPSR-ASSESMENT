# TASK 05 — API Views

## Goal
Implement all four DRF API views in `shortener/views.py`.

---

## File to Create

**`backend/shortener/views.py`** — replace the default content entirely.

---

## Endpoints to Implement

| Method | Path | View Class | Description |
|--------|------|------------|-------------|
| POST | `/api/shorten/` | `ShortenURLView` | Shorten a URL (rate-limited) |
| GET | `/api/urls/` | `URLListView` | List all shortened URLs |
| GET | `/api/urls/<alias>/` | `URLDetailView` | Detail for one URL |
| GET | `/api/urls/<alias>/analytics/` | `URLAnalyticsView` | 7-day daily click data |

---

## Full File Content

```python
"""
views.py
--------
All API views for the URL shortener.

Endpoints:
  POST /api/shorten/                     — shorten a URL (rate-limited)
  GET  /api/urls/                        — list all shortened URLs
  GET  /api/urls/<alias>/                — detail for one alias
  GET  /api/urls/<alias>/analytics/      — 7-day click analytics
"""

from datetime import date, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Click, ShortenedURL
from .rate_limiter import RateLimitExceeded, check_rate_limit, get_client_ip
from .serializers import (
    AnalyticsDataPointSerializer,
    ShortenRequestSerializer,
    ShortenedURLSerializer,
)


class ShortenURLView(APIView):
    """
    POST /api/shorten/

    Body:
        { "url": "https://example.com/long/path" }

    Success (201):
        {
            "id": 1,
            "alias": "a1b2c3",
            "original_url": "https://example.com/long/path",
            "short_url": "http://localhost:8000/a1b2c3/",
            "total_clicks": 0,
            "created_at": "2025-05-13T10:00:00Z"
        }

    Rate limit exceeded (429):
        {
            "error": "Rate limit exceeded.",
            "retry_after_seconds": 42,
            "message": "You can shorten up to 5 URLs per minute. Please wait 42 second(s)."
        }
        Header: Retry-After: 42
    """

    def post(self, request: Request) -> Response:
        ip = get_client_ip(request)

        # ── 1. Rate limit check ──────────────────────────────────────────────
        try:
            check_rate_limit(ip)
        except RateLimitExceeded as exc:
            return Response(
                {
                    'error': 'Rate limit exceeded.',
                    'retry_after_seconds': exc.retry_after,
                    'message': (
                        f'You can shorten up to 5 URLs per minute. '
                        f'Please wait {exc.retry_after} second(s).'
                    ),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={'Retry-After': str(exc.retry_after)},
            )

        # ── 2. Validate request body ─────────────────────────────────────────
        serializer = ShortenRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        original_url: str = serializer.validated_data['url']

        # ── 3. Generate a unique alias ───────────────────────────────────────
        alias = ShortenedURL.generate_alias(original_url)
        attempts = 0
        while ShortenedURL.objects.filter(alias=alias).exists() and attempts < 5:
            alias = ShortenedURL.generate_alias(original_url + str(attempts))
            attempts += 1

        if attempts == 5 and ShortenedURL.objects.filter(alias=alias).exists():
            return Response(
                {'error': 'Could not generate a unique alias. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        shortened = ShortenedURL.objects.create(
            alias=alias,
            original_url=original_url,
        )

        out = ShortenedURLSerializer(shortened, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class URLListView(APIView):
    """
    GET /api/urls/

    Returns all shortened URLs ordered by creation date (newest first).
    Each entry includes total_clicks computed from related Click rows.

    Success (200): list of ShortenedURL objects
    """

    def get(self, request: Request) -> Response:
        urls = ShortenedURL.objects.prefetch_related('clicks').all()
        serializer = ShortenedURLSerializer(
            urls, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class URLDetailView(APIView):
    """
    GET /api/urls/<alias>/

    Returns detail for a single shortened URL.

    Success (200): single ShortenedURL object with total_clicks
    Not found (404): { "error": "No URL found for alias 'xyz'." }
    """

    def get(self, request: Request, alias: str) -> Response:
        try:
            url = ShortenedURL.objects.prefetch_related('clicks').get(alias=alias)
        except ShortenedURL.DoesNotExist:
            return Response(
                {'error': f"No URL found for alias '{alias}'."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ShortenedURLSerializer(url, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class URLAnalyticsView(APIView):
    """
    GET /api/urls/<alias>/analytics/

    Returns daily click counts for the last 7 days (oldest → newest).
    Days with zero clicks are included (zero-filled).

    Success (200):
        {
            "alias": "a1b2c3",
            "original_url": "https://example.com/...",
            "data": [
                { "date": "2025-05-07", "clicks": 2 },
                { "date": "2025-05-08", "clicks": 0 },
                ...
                { "date": "2025-05-13", "clicks": 4 }
            ]
        }

    Not found (404): { "error": "No URL found for alias 'xyz'." }
    """

    def get(self, request: Request, alias: str) -> Response:
        try:
            url = ShortenedURL.objects.get(alias=alias)
        except ShortenedURL.DoesNotExist:
            return Response(
                {'error': f"No URL found for alias '{alias}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        today: date = timezone.now().date()
        # Build a list of the last 7 days, oldest first
        days: list[date] = [today - timedelta(days=i) for i in range(6, -1, -1)]

        # Aggregate clicks per day from the database
        clicks_qs = Click.objects.filter(
            shortened_url=url,
            clicked_at__date__gte=days[0],
        )
        counts: dict[date, int] = {}
        for click in clicks_qs:
            d = click.clicked_at.date()
            counts[d] = counts.get(d, 0) + 1

        # Zero-fill missing days
        data = [{'date': str(d), 'clicks': counts.get(d, 0)} for d in days]
        serializer = AnalyticsDataPointSerializer(data, many=True)

        return Response(
            {
                'alias': url.alias,
                'original_url': url.original_url,
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )
```

---

## Acceptance Criteria

- [ ] `POST /api/shorten/` returns **201** on success with `alias`, `short_url`, `total_clicks`
- [ ] `POST /api/shorten/` returns **400** when `url` is missing or invalid
- [ ] `POST /api/shorten/` returns **429** after 5 requests from the same IP within 60s
- [ ] The 429 response body contains `retry_after_seconds` (integer) and `message`
- [ ] The 429 response includes the `Retry-After` HTTP header
- [ ] `GET /api/urls/` returns a JSON array (empty array `[]` if no URLs exist)
- [ ] `GET /api/urls/<alias>/` returns **404** for unknown aliases
- [ ] `GET /api/urls/<alias>/analytics/` always returns exactly 7 data points
- [ ] Analytics data points with no clicks show `"clicks": 0` (not omitted)
- [ ] Analytics data is ordered oldest → newest

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `total_clicks` triggers N+1 queries | Add `prefetch_related('clicks')` to queryset |
| `short_url` is a relative path | Pass `context={'request': request}` to serializer |
| Analytics returns fewer than 7 days | Build the `days` list explicitly, don't rely on queryset alone |
| 429 body missing `retry_after_seconds` | The key name must match exactly — frontend depends on it |
| Alias collision loop runs forever | Cap at 5 attempts and return 500 if still colliding |
