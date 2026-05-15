# FE TASK 06 — App Shell (Root Layout)

## Goal
Wire all three components together in `App.jsx`. This is the root of the React
tree. It owns the shared state (selected alias, refresh trigger) and passes the
right props down to each child component.

---

## Files to Create / Replace

1. **`frontend/src/App.jsx`** — replace the Vite default entirely
2. **`frontend/src/main.jsx`** — minimal entry point (small tweak only)

---

## State owned by App

| State variable | Type | Purpose |
|----------------|------|---------|
| `selectedAlias` | `string \| null` | Which URL the user has clicked in URLList |
| `refreshTrigger` | `number` | Incrementing counter — changing it forces URLList to re-fetch |

---

## Data flow diagram

```
App
 ├── ShortenForm
 │     props:  onSuccess={handleNewURL}
 │     effect: increments refreshTrigger after a successful shorten
 │
 ├── URLList
 │     props:  onSelect={setSelectedAlias}
 │             selectedAlias={selectedAlias}
 │             refreshTrigger={refreshTrigger}
 │
 └── AnalyticsChart
       props:  alias={selectedAlias}
```

---

## File 1 — `App.jsx`

```jsx
import { useState, useCallback } from 'react';
import ShortenForm from './components/ShortenForm/ShortenForm.jsx';
import URLList from './components/URLList/URLList.jsx';
import AnalyticsChart from './components/AnalyticsChart/AnalyticsChart.jsx';
import './App.css';

export default function App() {
  // Which alias the user has selected in the URL list
  const [selectedAlias, setSelectedAlias] = useState(null);

  // Incrementing this value tells URLList to re-fetch its data.
  // ShortenForm calls handleNewURL after a successful 201, which bumps
  // this counter, which triggers the URLList useEffect.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewURL = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleSelectAlias = useCallback((alias) => {
    setSelectedAlias(alias);
  }, []);

  return (
    <div className="app">
      {/* ── Top navigation bar ───────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-logo">🔗 Snip</span>
          <span className="app-tagline">Rate-limited URL shortener with analytics</span>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="app-main">

        {/* URL shortener form — full width */}
        <section className="app-card">
          <ShortenForm onSuccess={handleNewURL} />
        </section>

        {/* Two-column dashboard: URL list + analytics chart */}
        <div className="app-dashboard">
          <div className="app-card app-card--list">
            <URLList
              onSelect={handleSelectAlias}
              selectedAlias={selectedAlias}
              refreshTrigger={refreshTrigger}
            />
          </div>

          <div className="app-card app-card--chart">
            <AnalyticsChart alias={selectedAlias} />
          </div>
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <p>Grepsr Assessment · Django REST + React · Built with Chart.js</p>
      </footer>
    </div>
  );
}
```

---

## File 2 — `main.jsx`

Replace the Vite default with this clean version:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## Acceptance Criteria

- [ ] `App.jsx` renders without errors and shows all three components
- [ ] `ShortenForm` receives `onSuccess` and calling it increments `refreshTrigger`
- [ ] `URLList` receives `onSelect`, `selectedAlias`, and `refreshTrigger`
- [ ] `AnalyticsChart` receives the current `selectedAlias`
- [ ] Shortening a new URL automatically refreshes the URL list (no manual click needed)
- [ ] Clicking a URL card in the list updates the chart without a page reload
- [ ] The layout renders a header, two-column dashboard, and footer
- [ ] `main.jsx` wraps the app in `<StrictMode>`

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| URLList does not refresh after shortening | `handleNewURL` must call `setRefreshTrigger(prev => prev + 1)`, not `setRefreshTrigger(1)` |
| Chart doesn't update when a card is clicked | `setSelectedAlias` must be passed as `onSelect` to `URLList` |
| Components render in wrong order | Keep ShortenForm above the dashboard grid |
| `useCallback` deps array wrong | `handleNewURL` has no deps; `handleSelectAlias` has no deps |
| `StrictMode` causes double fetch in dev | Expected behaviour in development — effects run twice intentionally |
