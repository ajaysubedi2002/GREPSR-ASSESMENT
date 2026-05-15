# FE TASK 09 — Browser Smoke Test Checklist

## Goal
Manually verify every user-facing feature in the browser before submitting.
This task has no code to write — it is a structured pass/fail checklist.

Run every test with:
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173` (dev) OR `http://localhost:3000` (Docker)
- Browser DevTools open (F12) — Console and Network tabs visible

---

## Prerequisites

```bash
# Terminal 1 — backend
cd backend && python manage.py runserver

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in the browser.

---

## Test Suite

### Section A — Initial Page Load

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| A1 | Open `http://localhost:5173` | Page loads, no console errors | ☐ |
| A2 | Header is visible | Shows logo "🔗 Snip" and tagline | ☐ |
| A3 | URL shortener form is visible | Input field + "Shorten" button present | ☐ |
| A4 | URL list shows loading spinner | Spinner appears briefly, then list or empty state | ☐ |
| A5 | Analytics panel shows placeholder | "Select a URL from the list" message visible | ☐ |
| A6 | Network tab — `GET /api/urls/` fires on load | Status 200, response is JSON array | ☐ |

---

### Section B — URL Shortening (Happy Path)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| B1 | Type `https://www.google.com` into the input and click "Shorten" | Button changes to "Shortening…", input disabled | ☐ |
| B2 | After response | Green success box appears with a short URL | ☐ |
| B3 | Short URL format | Looks like `http://localhost:8000/a1b2c3/` | ☐ |
| B4 | Click "Copy" button | No error; `navigator.clipboard.writeText` is called | ☐ |
| B5 | Input field after success | Input is cleared and re-enabled | ☐ |
| B6 | URL list after success | New entry appears at the top of the list automatically (no manual refresh needed) | ☐ |
| B7 | Network tab | `POST /api/shorten/` returned 201 | ☐ |

---

### Section C — URL Shortening (Validation Errors)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| C1 | Click "Shorten" with empty input | Red error banner: "Please enter a URL." No API call made | ☐ |
| C2 | Type `not-a-url` and click "Shorten" | Red error banner with validation message from API | ☐ |
| C3 | Type `example.com` (no scheme) and click "Shorten" | Red error banner: URL must include http:// or https:// | ☐ |
| C4 | Input and button remain usable after an error | Form stays in error state but button is enabled for retry | ☐ |

---

### Section D — Rate Limiting (429 Countdown Timer)

| # | Test | Steps | Expected | Pass? |
|---|------|-------|----------|-------|
| D1 | Trigger rate limit | Shorten 5 different URLs in quick succession (click Shorten 5 times fast) | First 5 succeed with 201 | ☐ |
| D2 | 6th request | Attempt to shorten a 6th URL | Orange/yellow warning banner appears | ☐ |
| D3 | Countdown timer | Observe the button | Button reads "Try again in Xs" and the number decrements every second | ☐ |
| D4 | Input disabled | Try typing in the input | Input field is disabled during countdown | ☐ |
| D5 | Banner message | Read the banner | Shows "Rate limit reached. You can shorten 5 URLs per minute. Please wait X second(s)." | ☐ |
| D6 | Auto-recovery | Wait for countdown to reach 0 | Form returns to idle state automatically, button reads "Shorten" | ☐ |
| D7 | Network tab | Check the 429 response | Response body contains `retry_after_seconds` (integer) | ☐ |

---

### Section E — Analytics Dashboard

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| E1 | URL list renders | Shows all shortened URLs as clickable cards | ☐ |
| E2 | Each card shows alias | Monospace alias in indigo/purple colour | ☐ |
| E3 | Each card shows click count | Badge showing "0 clicks", "1 click", etc. | ☐ |
| E4 | Click a URL card | Card highlights (indigo border), chart loads | ☐ |
| E5 | Chart renders | Line chart appears with 7 data points | ☐ |
| E6 | X axis labels | Shows 7 date labels in "May 13" format (not ISO) | ☐ |
| E7 | Y axis | Shows whole numbers only (no 0.5, 1.5) | ☐ |
| E8 | Chart subtitle | Shows alias code + truncated original URL | ☐ |
| E9 | Total clicks | "Total clicks in this period: X" shown below chart | ☐ |
| E10 | Network tab | `GET /api/urls/<alias>/analytics/` fired on card click | ☐ |

---

### Section F — Refresh Buttons

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| F1 | Click "↻ Refresh" in URL list | List re-fetches, spinner shown briefly, list updates | ☐ |
| F2 | No full page reload | URL in browser address bar does not change | ☐ |
| F3 | Click "↻ Refresh" in chart panel | Chart re-fetches analytics, spinner shown briefly | ☐ |
| F4 | Refresh button disabled while loading | Button shows "Loading…" and is non-clickable during fetch | ☐ |

---

### Section G — Click Tracking

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| G1 | Open a short URL directly | Navigate to `http://localhost:8000/a1b2c3/` in a new tab | Redirects to original URL (302) | ☐ |
| G2 | Return to dashboard | Go back to `http://localhost:5173` | — |
| G3 | Refresh URL list | Click "↻ Refresh" | Click count on the card increments by 1 | ☐ |
| G4 | Refresh chart | Select the URL and click "↻ Refresh" on the chart | Today's data point shows the new click | ☐ |

---

### Section H — Error Handling & Edge Cases

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| H1 | Stop the backend server | Kill `python manage.py runserver` | — |
| H2 | Try to shorten a URL | Error banner: "Network error — is the backend running?" | ☐ |
| H3 | URL list error state | Shows error banner with "Retry" button | ☐ |
| H4 | Click "Retry" in URL list | Re-fetch attempt made (will fail again if backend still down) | ☐ |
| H5 | Restart backend | Start `python manage.py runserver` again | — |
| H6 | Click "Retry" again | List loads successfully | ☐ |

---

### Section I — Responsive Layout

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| I1 | Open DevTools device toolbar | Set viewport to 375px wide (iPhone) | ☐ |
| I2 | Dashboard layout | URL list and chart stack vertically (single column) | ☐ |
| I3 | Tagline hidden | Header tagline not visible on mobile | ☐ |
| I4 | Form usable on mobile | Input and button still accessible, no overflow | ☐ |

---

### Section J — Docker (if FE TASK 08 completed)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| J1 | Run `docker-compose up --build` from repo root | Both services start without errors | ☐ |
| J2 | Open `http://localhost:3000` | React app loads correctly | ☐ |
| J3 | Shorten a URL via Docker frontend | Full flow works end-to-end | ☐ |
| J4 | `http://localhost:8000/api/urls/` | Still returns JSON | ☐ |

---

## Pass Threshold

| Sections | Min pass rate to submit |
|----------|------------------------|
| A–C (core) | 100% |
| D (rate limiting) | 100% — this is a key graded criterion |
| E–F (dashboard) | 100% |
| G (click tracking) | 100% |
| H (error handling) | All "Retry" flows must work |
| I (responsive) | I1–I4 |
| J (Docker) | Optional but recommended |

---

## How to Report a Failure

For any test that fails, note:
1. The test ID (e.g. `D3`)
2. What actually happened vs what was expected
3. Any error in the browser console
4. The network request/response (status code + body)

Then go back to the relevant task file and fix the issue before re-running.
