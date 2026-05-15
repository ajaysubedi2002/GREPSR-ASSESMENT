# FE TASK 01 — Project Setup & Dependencies

## Goal
Scaffold the React project using Vite, install all required packages, and
create the full folder structure. No component logic in this task — structure only.

---

## Prerequisite

Node.js >= 18 must be installed. Verify with:
```bash
node --version   # must print v18.x or higher
npm --version
```

---

## Steps

### 1. Scaffold with Vite

Run from inside `url-shortener/` (the repo root):

```bash
npm create vite@latest frontend -- --template react
cd frontend
```

This creates:
```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

### 2. Install dependencies

```bash
npm install
npm install chart.js react-chartjs-2
```

Final `package.json` dependencies section must contain:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "chart.js": "^4.0.0",
    "react-chartjs-2": "^5.0.0"
  }
}
```

### 3. Create the folder structure

```bash
mkdir -p src/api
mkdir -p src/components/ShortenForm
mkdir -p src/components/URLList
mkdir -p src/components/AnalyticsChart
```

### 4. Create placeholder files (empty — filled in later tasks)

```bash
touch src/api/api.js
touch src/components/ShortenForm/ShortenForm.jsx
touch src/components/ShortenForm/ShortenForm.css
touch src/components/URLList/URLList.jsx
touch src/components/URLList/URLList.css
touch src/components/AnalyticsChart/AnalyticsChart.jsx
touch src/components/AnalyticsChart/AnalyticsChart.css
```

### 5. Clean up Vite boilerplate

Delete files that will be replaced:
```bash
rm src/assets/react.svg public/vite.svg
```

Clear `src/App.css` and `src/index.css` — they will be rewritten in FE TASK 07.

### 6. Verify the dev server starts

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` — the Vite default page should appear.

---

## Acceptance Criteria

- [ ] `frontend/` folder exists at repo root
- [ ] `npm run dev` starts without errors
- [ ] `chart.js` and `react-chartjs-2` appear in `package.json` dependencies
- [ ] `src/api/api.js` exists (empty)
- [ ] All three component folders exist with `.jsx` and `.css` files (empty)
- [ ] No console errors in the browser on initial load

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `npm create vite` asks interactive questions | Pass `-- --template react` to skip prompts |
| Port 5173 already in use | Kill the other process or Vite will auto-pick 5174 |
| `react-chartjs-2` not found at runtime | Run `npm install` from inside the `frontend/` directory |
| `src/assets/react.svg` import error after deletion | Remove the import from `App.jsx` too |
