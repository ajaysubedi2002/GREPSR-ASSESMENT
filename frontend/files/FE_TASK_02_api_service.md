# FE TASK 02 — API Service Layer

## Goal
Write a single `src/api/api.js` file that contains every backend call.
Components must never call `fetch` directly — they always go through this module.
This is the "single source of truth" for the backend base URL and all endpoints.

---

## File to Create

**`frontend/src/api/api.js`** — replace empty placeholder.

---

## Full File Content

```js
/**
 * api.js
 * ------
 * Central API client for the URL Shortener backend.
 *
 * All fetch calls live here. Components import named functions —
 * never call fetch directly from a component.
 *
 * Base URL is defined once. Change it here to point at a different environment.
 */

const BASE_URL = 'http://localhost:8000';

/**
 * Shorten a long URL.
 *
 * @param {string} url - The long URL to shorten.
 * @returns {Promise<object>} Resolved with the API response body.
 *
 * Response shapes:
 *   201 → { id, alias, original_url, short_url, total_clicks, created_at }
 *   400 → { url: ["error message"] }
 *   429 → { error, retry_after_seconds, message }
 *
 * This function does NOT throw on 429 — it returns the body so the
 * caller can read retry_after_seconds and show a countdown timer.
 */
export async function shortenURL(url) {
  const response = await fetch(`${BASE_URL}/api/shorten/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  // Attach the status so callers can branch on 201 vs 400 vs 429
  return { status: response.status, data };
}

/**
 * Fetch all shortened URLs.
 *
 * @returns {Promise<Array>} Array of URL objects ordered newest-first.
 *   Each item: { id, alias, original_url, short_url, total_clicks, created_at }
 *
 * Throws on network error. Returns empty array if backend returns [].
 */
export async function fetchAllURLs() {
  const response = await fetch(`${BASE_URL}/api/urls/`);

  if (!response.ok) {
    throw new Error(`Failed to fetch URLs (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch 7-day click analytics for one alias.
 *
 * @param {string} alias - The 6-character alias string.
 * @returns {Promise<object>} { alias, original_url, data: [{date, clicks}] }
 *   data always contains exactly 7 items, oldest to newest.
 *
 * Throws on network error or 404.
 */
export async function fetchAnalytics(alias) {
  const response = await fetch(`${BASE_URL}/api/urls/${alias}/analytics/`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch analytics (${response.status})`);
  }

  return response.json();
}
```

---

## Contract — what each function returns

| Function | Success | Error |
|----------|---------|-------|
| `shortenURL(url)` | `{ status: 201, data: {...} }` | `{ status: 400\|429, data: {...} }` |
| `fetchAllURLs()` | `Array` (may be `[]`) | throws `Error` |
| `fetchAnalytics(alias)` | `{ alias, original_url, data: [...] }` | throws `Error` |

---

## Acceptance Criteria

- [ ] `BASE_URL` is defined once at the top — not repeated in any function
- [ ] `shortenURL` returns `{ status, data }` — it does NOT throw on 429
- [ ] `fetchAllURLs` throws an `Error` on non-2xx responses
- [ ] `fetchAnalytics` throws an `Error` with a human-readable message on failure
- [ ] No `console.log` or `console.error` left in the file
- [ ] No component file imports `fetch` directly — only imports from `./api/api.js`

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| CORS error in browser console | Ensure `django-cors-headers` is installed and backend is running |
| `fetchAllURLs` throws on empty list | Backend returns `[]` with status 200 — only throw on `!response.ok` |
| `shortenURL` swallows 429 silently | Return `{ status, data }` — never throw inside `shortenURL` |
| `BASE_URL` has a trailing slash | Remove it — functions add their own `/api/...` prefix |
