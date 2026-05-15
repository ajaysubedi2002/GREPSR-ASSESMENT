# TASK 09 — Migrations & Smoke Test

## Goal
Generate migrations, apply them, start the server, and verify every endpoint
responds correctly with `curl` before moving on to Docker.

---

## Steps

### 1. Create migrations

```bash
cd backend
python manage.py makemigrations shortener
```

Expected output:
```
Migrations for 'shortener':
  shortener/migrations/0001_initial.py
    - Create model ShortenedURL
    - Create model RateLimitEntry
    - Create model Click
```

### 2. Apply migrations

```bash
python manage.py migrate
```

Expected output: all migrations apply with `OK`.

### 3. Start the dev server

```bash
python manage.py runserver
```

Server should start at `http://127.0.0.1:8000/`.

---

## Smoke Tests (run in a second terminal)

Run these `curl` commands in order. Expected responses are shown below each.

### Test A — Shorten a URL

```bash
curl -s -X POST http://127.0.0.1:8000/api/shorten/ \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/a/very/long/path?query=value&another=1"}'
```

Expected (status 201):
```json
{
  "id": 1,
  "alias": "a1b2c3",
  "original_url": "https://www.example.com/a/very/long/path?query=value&another=1",
  "short_url": "http://127.0.0.1:8000/a1b2c3/",
  "total_clicks": 0,
  "created_at": "2025-05-13T10:00:00.000000Z"
}
```

Save the `alias` value from the response for the next tests.

---

### Test B — Trigger the redirect

```bash
# Replace a1b2c3 with the actual alias from Test A
curl -v http://127.0.0.1:8000/a1b2c3/
```

Expected: HTTP `302` response with `Location: https://www.example.com/...` header.

---

### Test C — Check click was recorded

```bash
curl -s http://127.0.0.1:8000/api/urls/a1b2c3/
```

Expected: `"total_clicks": 1`

---

### Test D — Analytics endpoint

```bash
curl -s http://127.0.0.1:8000/api/urls/a1b2c3/analytics/
```

Expected: exactly 7 data points, today's date showing `"clicks": 1`.

---

### Test E — Rate limiting (run 6 times fast)

```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://127.0.0.1:8000/api/shorten/ \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com/test'$i'"}'
done
```

Expected output:
```
201
201
201
201
201
429
```

---

### Test F — 429 response body

```bash
# After hitting the limit, check the body:
curl -s -X POST http://127.0.0.1:8000/api/shorten/ \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/overflow"}'
```

Expected (status 429):
```json
{
  "error": "Rate limit exceeded.",
  "retry_after_seconds": 42,
  "message": "You can shorten up to 5 URLs per minute. Please wait 42 second(s)."
}
```

---

### Test G — Invalid URL

```bash
curl -s -X POST http://127.0.0.1:8000/api/shorten/ \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-valid-url"}'
```

Expected (status 400):
```json
{
  "url": ["Please provide a valid URL including the scheme (http:// or https://)."]
}
```

---

### Test H — Unknown alias (404)

```bash
curl -s http://127.0.0.1:8000/api/urls/xxxxxx/
```

Expected (status 404):
```json
{ "error": "No URL found for alias 'xxxxxx'." }
```

---

## Acceptance Criteria

- [ ] `makemigrations` creates `0001_initial.py` with all three models
- [ ] `migrate` completes with no errors
- [ ] Test A returns status 201 with all required fields
- [ ] Test B returns status 302 with a `Location` header
- [ ] Test C shows `total_clicks` incrementing after the redirect
- [ ] Test D returns exactly 7 `{date, clicks}` objects
- [ ] Test E shows exactly 5 × 201 then 1 × 429
- [ ] Test F body contains `retry_after_seconds` as an integer
- [ ] Test G returns 400 with a validation error on the `url` field
- [ ] Test H returns 404 JSON (not an HTML error page)

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `makemigrations` detects no changes | Confirm `shortener` is in `INSTALLED_APPS` |
| `migrate` fails with `no such table` | Run `makemigrations shortener` first |
| Test B returns 200 instead of 302 | `redirect()` must use `permanent=False` and `curl` must NOT follow redirects (use `-v` not `-L`) |
| Test E never reaches 429 | Rate limiter uses `select_for_update()` — ensure `transaction.atomic()` wraps it |
| Test D returns 6 or 8 points | Fix the range in `URLAnalyticsView`: `range(6, -1, -1)` gives 7 days |
