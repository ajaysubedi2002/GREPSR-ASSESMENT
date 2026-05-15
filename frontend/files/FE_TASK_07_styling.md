# FE TASK 07 — Global Styling

## Goal
Write the global CSS files that make the application look clean and professional.
No inline styles. No CSS framework. All component-level styles are already written
in their `.css` files (Tasks 03–05). This task covers `index.css` and `App.css` only.

---

## Files to Create / Replace

1. **`frontend/src/index.css`** — CSS reset + design tokens + global typography
2. **`frontend/src/App.css`** — App shell layout (header, main, dashboard grid, footer)

---

## File 1 — `index.css`

```css
/* ── Reset ──────────────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Design tokens ──────────────────────────────────────────────────────── */
:root {
  /* Brand */
  --color-primary:       #4f46e5;
  --color-primary-dark:  #4338ca;
  --color-primary-light: #eef2ff;

  /* Neutrals */
  --color-bg:            #f9fafb;
  --color-surface:       #ffffff;
  --color-border:        #e5e7eb;
  --color-text-primary:  #111827;
  --color-text-secondary:#6b7280;
  --color-text-muted:    #9ca3af;

  /* Status */
  --color-success:       #16a34a;
  --color-success-bg:    #f0fdf4;
  --color-warning:       #d97706;
  --color-warning-bg:    #fffbeb;
  --color-error:         #dc2626;
  --color-error-bg:      #fef2f2;

  /* Spacing */
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2rem;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
               0 2px 4px -2px rgba(0, 0, 0, 0.05);
}

/* ── Base typography ────────────────────────────────────────────────────── */
html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Anchor reset ───────────────────────────────────────────────────────── */
a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* ── Button reset ───────────────────────────────────────────────────────── */
button {
  font-family: inherit;
  font-size: inherit;
}

/* ── Focus visible ──────────────────────────────────────────────────────── */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ── Code ───────────────────────────────────────────────────────────────── */
code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

/* ── Scrollbar (webkit) ─────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 99px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
```

---

## File 2 — `App.css`

```css
/* ── App wrapper ────────────────────────────────────────────────────────── */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.app-header {
  background: #1a1a2e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 var(--space-lg);
  height: 56px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header__inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.app-logo {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.app-tagline {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.45);
}

/* ── Main content ────────────────────────────────────────────────────────── */
.app-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* ── Card (shared surface) ───────────────────────────────────────────────── */
.app-card {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

/* ── Dashboard two-column grid ───────────────────────────────────────────── */
.app-dashboard {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.app-card--list {
  /* Fixed width column — scroll internally if list is long */
  min-width: 0;
}

.app-card--chart {
  min-width: 0;
}

/* ── Responsive — stack on narrow screens ────────────────────────────────── */
@media (max-width: 768px) {
  .app-main {
    padding: var(--space-md);
  }

  .app-dashboard {
    grid-template-columns: 1fr;
  }

  .app-tagline {
    display: none;
  }
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
.app-footer {
  text-align: center;
  padding: var(--space-lg);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
}
```

---

## Acceptance Criteria

- [ ] `index.css` defines CSS custom properties (`--color-primary`, etc.) on `:root`
- [ ] `body` has a light grey background (`#f9fafb`)
- [ ] The app header is dark (`#1a1a2e`) and sticky
- [ ] The dashboard section uses a two-column CSS Grid (340px left, `1fr` right)
- [ ] On screens ≤ 768px, the grid stacks to a single column
- [ ] No `!important` declarations in any CSS file
- [ ] No inline styles in any `.jsx` file
- [ ] The page renders without horizontal scrollbar at 375px viewport width

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| Dashboard columns overflow on mobile | Add `@media (max-width: 768px)` grid override |
| Chart card too narrow to show chart | Set `min-width: 0` on grid children to allow shrinking |
| Header not sticky on scroll | Add `position: sticky; top: 0; z-index: 100` |
| Custom properties not applying | Check they are defined on `:root`, not on `html` or `body` |
| Cards have no visual separation from background | `background: #fff` + `border` + `box-shadow` on `.app-card` |
