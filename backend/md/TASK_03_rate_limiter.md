# TASK 03 — Custom Fixed Window Rate Limiter

## Goal
Implement the rate limiter from scratch in `shortener/rate_limiter.py`.
**No third-party rate-limiting library is permitted.**
This is the core algorithmic challenge of the assessment.

---

## File to Create

**`backend/shortener/rate_limiter.py`**

---

## Algorithm — Fixed Window

```
State per IP:  { window_start: float, request_count: int }

On each request from IP X:
  1. Load (or create) the RateLimitEntry row for IP X.
  2. elapsed = now - window_start
  3. IF elapsed >= 60:
       → window expired → reset: window_start = now, request_count = 1 → ALLOW
  4. ELSE IF request_count >= 5:
       → limit reached → retry_after = ceil(60 - elapsed) → REJECT with 429
  5. ELSE:
       → increment request_count → ALLOW
```

The row is locked with `SELECT FOR UPDATE` inside a `transaction.atomic()` block
to prevent race conditions when two requests from the same IP arrive simultaneously.

---

## Full File Content

```python
"""
rate_limiter.py
---------------
Custom Fixed Window rate limiter. No third-party library is used.

Algorithm
---------
Each IP address owns one row in RateLimitEntry with three fields:
  ip_address    — primary lookup key
  window_start  — Unix timestamp when the current window started
  request_count — how many requests have been made in this window

On every POST /api/shorten/ call:
  1. Fetch (or create) the row for this IP inside SELECT FOR UPDATE.
  2. If the window has expired (now - window_start >= WINDOW_SECONDS):
       reset window_start = now, request_count = 1, allow the request.
  3. If request_count >= MAX_REQUESTS:
       raise RateLimitExceeded with seconds remaining until window resets.
  4. Otherwise increment request_count and allow the request.

Complexity: O(1) per check. No background cleanup needed — stale windows
are overwritten lazily on the next request from that IP.
"""

import time
from django.conf import settings
from django.db import transaction

from .models import RateLimitEntry

MAX_REQUESTS: int = getattr(settings, 'RATE_LIMIT_MAX_REQUESTS', 5)
WINDOW_SECONDS: int = getattr(settings, 'RATE_LIMIT_WINDOW_SECONDS', 60)


def get_client_ip(request) -> str:
    """
    Extract the real client IP address from the request.

    Checks X-Forwarded-For first (set by load balancers / proxies).
    Falls back to REMOTE_ADDR for direct connections.
    """
    x_forwarded_for: str | None = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


class RateLimitExceeded(Exception):
    """
    Raised when an IP address has used all its requests for the current window.

    Attributes:
        retry_after (int): seconds the client must wait before trying again.
    """

    def __init__(self, retry_after: int) -> None:
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded. Retry after {retry_after}s.")


def check_rate_limit(ip_address: str) -> None:
    """
    Check and update the rate-limit state for the given IP address.

    Uses SELECT FOR UPDATE inside an atomic transaction to avoid race
    conditions when concurrent requests arrive from the same IP.

    Args:
        ip_address: The client's IP address string.

    Raises:
        RateLimitExceeded: if the IP has reached MAX_REQUESTS in this window.
    """
    now: float = time.time()

    with transaction.atomic():
        entry, _created = RateLimitEntry.objects.select_for_update().get_or_create(
            ip_address=ip_address,
            defaults={
                'window_start': now,
                'request_count': 0,
            },
        )

        elapsed: float = now - entry.window_start

        if elapsed >= WINDOW_SECONDS:
            # Window has expired — start a fresh window
            entry.window_start = now
            entry.request_count = 1
        else:
            if entry.request_count >= MAX_REQUESTS:
                retry_after = int(WINDOW_SECONDS - elapsed) + 1
                raise RateLimitExceeded(retry_after=retry_after)
            entry.request_count += 1

        entry.save()
```

---

## Configuration (set in settings.py — see TASK 08)

```python
RATE_LIMIT_MAX_REQUESTS = 5    # max requests per window
RATE_LIMIT_WINDOW_SECONDS = 60 # window size in seconds
```

---

## Acceptance Criteria

- [ ] `rate_limiter.py` contains `get_client_ip()`, `RateLimitExceeded`, and `check_rate_limit()`
- [ ] `check_rate_limit()` uses `transaction.atomic()` and `select_for_update()`
- [ ] No import of `flask_limiter`, `django_ratelimit`, or similar packages
- [ ] When called 5 times for the same IP in quick succession, the 6th call raises `RateLimitExceeded`
- [ ] `RateLimitExceeded.retry_after` is a positive integer (seconds)
- [ ] A new window starts automatically after 60 seconds (no manual reset needed)

---

## Manual Verification

```python
# Run in django shell: python manage.py shell
from shortener.rate_limiter import check_rate_limit, RateLimitExceeded

for i in range(6):
    try:
        check_rate_limit('192.168.1.1')
        print(f"Request {i+1}: ALLOWED")
    except RateLimitExceeded as e:
        print(f"Request {i+1}: BLOCKED — retry after {e.retry_after}s")
# Expected output:
# Request 1: ALLOWED
# Request 2: ALLOWED
# Request 3: ALLOWED
# Request 4: ALLOWED
# Request 5: ALLOWED
# Request 6: BLOCKED — retry after Xs
```

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| Race condition — two concurrent requests both allowed past limit | Ensure `select_for_update()` is used |
| `retry_after` is 0 or negative | Use `int(WINDOW_SECONDS - elapsed) + 1` (the +1 is a buffer) |
| Window never resets | The `elapsed >= WINDOW_SECONDS` branch must overwrite `window_start` |
| `get_or_create` returns stale data after update | Call `entry.save()` at the end of the `with` block |
