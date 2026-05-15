# Agent Task Suite — Frontend (React)
## Grepsr URL Shortener Assessment

## Overview

This folder contains all task files an agent needs to build the React frontend
for the Grepsr URL Shortener assessment. Each file is self-contained: it lists
the exact goal, which files to create, full component code, acceptance criteria,
and common failure modes.

**Read this file first**, then execute tasks in the order below.
The Django backend (port 8000) must be running before testing any task.

---

## Execution Order

```
FE_TASK_01_project_setup.md         — Vite scaffold, install deps, folder structure
FE_TASK_02_api_service.md           — central API client (all fetch calls in one file)
FE_TASK_03_url_shortener_form.md    — URL input form + 429 countdown timer
FE_TASK_04_url_list.md              — dashboard URL list with selection state
FE_TASK_05_analytics_chart.md       — Chart.js line chart for 7-day click data
FE_TASK_06_app_shell.md             — App.jsx root layout wiring all components
FE_TASK_07_styling.md               — index.css + App.css global styles
FE_TASK_08_docker_integration.md    — frontend Dockerfile + nginx.conf + docker-compose update
FE_TASK_09_smoke_test.md            — 40-point browser smoke test checklist (Sections A–J)
```

## Files Created Per Task

| Task | Files written |
|------|--------------|
| FE_TASK_01 | `package.json`, folder tree, empty placeholder files |
| FE_TASK_02 | `src/api/api.js` |
| FE_TASK_03 | `src/components/ShortenForm/ShortenForm.jsx`, `.css` |
| FE_TASK_04 | `src/components/URLList/URLList.jsx`, `.css` |
| FE_TASK_05 | `src/components/AnalyticsChart/AnalyticsChart.jsx`, `.css` |
| FE_TASK_06 | `src/App.jsx`, `src/main.jsx` |
| FE_TASK_07 | `src/index.css`, `src/App.css` |
| FE_TASK_08 | `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml` (updated) |
| FE_TASK_09 | No code — browser test checklist only |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 (functional components + hooks) |
| Build tool | Vite 5 |
| Chart library | Chart.js 4 + react-chartjs-2 |
| HTTP | native `fetch` (no axios) |
| Styling | plain CSS (one file per component) |
| Container | Docker + Nginx |

---

## Final Folder Structure (target)

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── api.js               — all API calls (one source of truth)
│   ├── components/
│   │   ├── ShortenForm/
│   │   │   ├── ShortenForm.jsx
│   │   │   └── ShortenForm.css
│   │   ├── URLList/
│   │   │   ├── URLList.jsx
│   │   │   └── URLList.css
│   │   └── AnalyticsChart/
│   │       ├── AnalyticsChart.jsx
│   │       └── AnalyticsChart.css
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── vite.config.js
├── package.json
└── Dockerfile
```

---

## Global Rules for the Agent

1. **ES6+ syntax only** — `const`/`let`, arrow functions, async/await, destructuring,
   template literals. Never use `var`.
2. **Functional components only** — no class components.
3. **2-space indentation** in all JS/JSX/CSS files.
4. **camelCase** for variables and functions. **PascalCase** for component names.
5. **No inline styles** — all styles go in the component's `.css` file.
6. Every `fetch` call must have a `try/catch`. Never let an unhandled rejection
   crash the UI.
7. **Loading states** must be shown while any fetch is in-flight.
8. **Error states** must display a human-readable message — never `console.error` only.
9. The backend base URL is `http://localhost:8000`. Store it in `src/api/api.js`
   only — never hardcode it in components.
10. After each task, open the browser and verify the component renders without
    console errors.
