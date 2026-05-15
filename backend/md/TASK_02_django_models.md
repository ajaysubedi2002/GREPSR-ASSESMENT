# TASK 02 — Django Models

## Goal
Define the three database models that power the entire application:
`ShortenedURL`, `Click`, and `RateLimitEntry`.

---

## File to Create

**`backend/shortener/models.py`** — replace the default content entirely.

---

## Full File Content

```python
import hashlib
import time
from django.db import models


class ShortenedURL(models.Model):
    """Maps a 6-character alias to the original long URL."""

    alias = models.CharField(max_length=6, unique=True, db_index=True)
    original_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.alias} -> {self.original_url[:60]}"

    @staticmethod
    def generate_alias(url: str) -> str:
        """
        Generate a deterministic 6-character alias using MD5 hashing.

        The current timestamp is mixed in so that shortening the same URL
        multiple times produces different aliases.
        """
        raw = f"{url}{time.time()}"
        return hashlib.md5(raw.encode()).hexdigest()[:6]


class Click(models.Model):
    """
    Records each redirect event for analytics.

    Every time a visitor hits /{alias}/, one Click row is inserted with:
      - a reference to the ShortenedURL
      - the exact timestamp (auto-set by Django)
      - the visitor's IP address
      - the visitor's User-Agent string (optional, for debugging)
    """

    shortened_url = models.ForeignKey(
        ShortenedURL,
        on_delete=models.CASCADE,
        related_name='clicks',
    )
    clicked_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-clicked_at']

    def __str__(self) -> str:
        return f"Click on {self.shortened_url.alias} at {self.clicked_at}"


class RateLimitEntry(models.Model):
    """
    Tracks URL-shortening requests per IP for the Fixed Window rate limiter.

    Fields:
      ip_address    — the client IP (one row per IP, enforced by unique_together)
      window_start  — Unix timestamp when the current 60-second window began
      request_count — number of shortening requests made in this window

    This table is read and written inside a SELECT FOR UPDATE transaction on
    every POST /api/shorten/ request.
    """

    ip_address = models.GenericIPAddressField(db_index=True, unique=True)
    window_start = models.FloatField()      # Unix epoch float
    request_count = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return (
            f"{self.ip_address}: {self.request_count} req "
            f"(window started {self.window_start})"
        )
```

---

## Schema Summary

| Model | Table | Key Fields |
|-------|-------|------------|
| `ShortenedURL` | `shortener_shortenedurl` | `alias` (unique, indexed), `original_url`, `created_at` |
| `Click` | `shortener_click` | FK → ShortenedURL, `clicked_at`, `ip_address` |
| `RateLimitEntry` | `shortener_ratelimitentry` | `ip_address` (unique), `window_start`, `request_count` |

---

## Acceptance Criteria

- [ ] All three model classes exist in `shortener/models.py`
- [ ] `ShortenedURL.alias` has `unique=True` and `db_index=True`
- [ ] `Click` has a `ForeignKey` to `ShortenedURL` with `on_delete=CASCADE`
- [ ] `RateLimitEntry.ip_address` has `unique=True`
- [ ] `ShortenedURL.generate_alias()` is a `@staticmethod` that returns a 6-char string
- [ ] `python manage.py check` passes after this file is saved

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `unique_together` conflict on RateLimitEntry | Use `unique=True` on the field itself instead of `unique_together` |
| `generate_alias` returns more than 6 chars | Slice with `[:6]` |
| Migration detects no changes | Ensure `shortener` is in `INSTALLED_APPS` (done in TASK 08) |
