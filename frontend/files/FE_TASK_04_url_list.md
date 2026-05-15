# FE TASK 04 — URL List (Analytics Dashboard)

## Goal
Build `URLList` — the dashboard panel that fetches all shortened URLs from the
backend, displays them in a selectable list, and notifies the parent which alias
the user has selected so the chart can update.

---

## Files to Create

1. **`frontend/src/components/URLList/URLList.jsx`**
2. **`frontend/src/components/URLList/URLList.css`**

---

## Component Behaviour

```
On mount        → fetch GET /api/urls/, show loading spinner
On fetch done   → render a list of URL cards (newest first)
On card click   → highlight the selected card, call onSelect(alias)
On Refresh btn  → re-fetch the list without a full page reload
Empty state     → "No URLs shortened yet." message
Error state     → error banner with a Retry button
```

---

## File 1 — `URLList.jsx`

```jsx
import { useState, useEffect, useCallback } from 'react';
import { fetchAllURLs } from '../../api/api.js';
import './URLList.css';

/**
 * URLList
 *
 * Props:
 *   onSelect     (function) — called with the alias string when a URL is clicked
 *   selectedAlias (string)  — the currently selected alias (for highlight styling)
 *   refreshTrigger (any)    — change this value from the parent to trigger a re-fetch
 *                             (used when a new URL is shortened via ShortenForm)
 */
export default function URLList({ onSelect, selectedAlias, refreshTrigger }) {
  const [urls, setUrls]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const loadURLs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllURLs();
      setUrls(data);
    } catch (err) {
      setError(err.message || 'Failed to load URLs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and whenever refreshTrigger changes
  useEffect(() => {
    loadURLs();
  }, [loadURLs, refreshTrigger]);

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function truncate(str, maxLength = 50) {
    return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
  }

  return (
    <section className="url-list-section">
      <div className="url-list-header">
        <h2 className="url-list-title">All Shortened URLs</h2>
        <button
          className="url-list-refresh"
          onClick={loadURLs}
          disabled={loading}
          aria-label="Refresh URL list"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="url-list-loading" role="status" aria-live="polite">
          <span className="url-list-spinner" aria-hidden="true" />
          Loading URLs…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="url-list-error" role="alert">
          <p>❌ {error}</p>
          <button className="url-list-retry" onClick={loadURLs}>
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && urls.length === 0 && (
        <p className="url-list-empty">
          No URLs shortened yet. Use the form above to get started.
        </p>
      )}

      {/* URL cards */}
      {!loading && !error && urls.length > 0 && (
        <ul className="url-list" role="list">
          {urls.map(url => (
            <li key={url.id}>
              <button
                className={`url-card ${selectedAlias === url.alias ? 'url-card--selected' : ''}`}
                onClick={() => onSelect(url.alias)}
                aria-pressed={selectedAlias === url.alias}
              >
                <div className="url-card__top">
                  <span className="url-card__alias">{url.alias}</span>
                  <span className="url-card__clicks">
                    {url.total_clicks} click{url.total_clicks !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="url-card__original">
                  {truncate(url.original_url)}
                </div>
                <div className="url-card__meta">
                  Created {formatDate(url.created_at)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

---

## File 2 — `URLList.css`

```css
.url-list-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.url-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.url-list-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a2e;
}

.url-list-refresh {
  padding: 0.375rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f3f4f6;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.url-list-refresh:hover:not(:disabled) {
  background: #e5e7eb;
}

.url-list-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading */
.url-list-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  padding: 1rem 0;
}

.url-list-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.url-list-error {
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.url-list-retry {
  padding: 0.3rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

/* Empty */
.url-list-empty {
  color: #6b7280;
  font-size: 0.9rem;
  padding: 1rem 0;
}

/* Cards */
.url-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 420px;
  overflow-y: auto;
}

.url-card {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.url-card:hover {
  border-color: #a5b4fc;
  background: #f5f3ff;
}

.url-card--selected {
  border-color: #4f46e5;
  background: #eef2ff;
}

.url-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.url-card__alias {
  font-family: monospace;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #4f46e5;
}

.url-card__clicks {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #059669;
  background: #d1fae5;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
}

.url-card__original {
  font-size: 0.8125rem;
  color: #374151;
  word-break: break-all;
}

.url-card__meta {
  font-size: 0.75rem;
  color: #9ca3af;
}
```

---

## Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSelect` | `function(alias: string)` | Yes | Called when user clicks a URL card |
| `selectedAlias` | `string` | No | Alias to highlight as selected |
| `refreshTrigger` | `any` | No | Change this value to force a re-fetch |

---

## Acceptance Criteria

- [ ] On mount, the component calls `GET /api/urls/` and renders the results
- [ ] A spinner is shown while loading
- [ ] Clicking a URL card calls `onSelect` with the alias string
- [ ] The selected card is visually highlighted with `url-card--selected` class
- [ ] `total_clicks` is displayed on each card
- [ ] Clicking "↻ Refresh" re-fetches the list without a page reload
- [ ] The Refresh button is disabled while loading is in progress
- [ ] If the fetch fails, an error banner appears with a "Retry" button
- [ ] If the list is empty, a friendly empty-state message is shown
- [ ] When `refreshTrigger` prop changes, the list re-fetches automatically

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `useEffect` re-fetches in an infinite loop | Wrap `loadURLs` in `useCallback` and include it (not recreated) in deps array |
| Clicking Refresh while loading fires duplicate requests | Disable the button when `loading === true` |
| Selected card doesn't highlight | Compare `selectedAlias === url.alias` (strings), not objects |
| List doesn't update after new URL is shortened | Pass a changing `refreshTrigger` value from the parent (`App.jsx`) |
| `total_clicks` shows `NaN` | Guard with `url.total_clicks ?? 0` |
