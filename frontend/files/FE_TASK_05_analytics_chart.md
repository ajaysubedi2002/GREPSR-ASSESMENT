# FE TASK 05 — Analytics Chart (Chart.js Line Chart)

## Goal
Build `AnalyticsChart` — the panel that fetches 7-day click data for a selected
alias and renders it as a line chart using Chart.js. It must include a "Refresh"
button that updates the chart in-place without a full page reload.

---

## Files to Create

1. **`frontend/src/components/AnalyticsChart/AnalyticsChart.jsx`**
2. **`frontend/src/components/AnalyticsChart/AnalyticsChart.css`**

---

## Component Behaviour

```
No alias selected  → placeholder "Select a URL from the list to view analytics"
Alias selected     → fetch /api/urls/<alias>/analytics/, show spinner
Fetch done         → render line chart with 7 data points
Refresh clicked    → re-fetch and re-render chart in-place (no page reload)
Fetch fails        → error banner with Retry button
```

---

## Chart.js Registration Requirement

Chart.js v4 requires explicit registration of the components you use.
This must be done **once**, at the top of the file, before any component code.

```js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

---

## File 1 — `AnalyticsChart.jsx`

```jsx
import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { fetchAnalytics } from '../../api/api.js';
import './AnalyticsChart.css';

// Register Chart.js components once at module level
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * AnalyticsChart
 *
 * Props:
 *   alias (string | null) — the selected URL alias; null means nothing is selected
 */
export default function AnalyticsChart({ alias }) {
  const [analytics, setAnalytics] = useState(null); // { alias, original_url, data: [...] }
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const loadAnalytics = useCallback(async () => {
    if (!alias) return;

    setLoading(true);
    setError('');

    try {
      const data = await fetchAnalytics(alias);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [alias]);

  // Re-fetch whenever the selected alias changes
  useEffect(() => {
    if (alias) {
      loadAnalytics();
    } else {
      setAnalytics(null);
      setError('');
    }
  }, [alias, loadAnalytics]);

  // ── Build Chart.js data object ─────────────────────────────────────────────
  function buildChartData(analyticsData) {
    const labels = analyticsData.data.map(point => {
      // Format "2025-05-13" → "May 13"
      const date = new Date(point.date + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const values = analyticsData.data.map(point => point.clicks);

    return {
      labels,
      datasets: [
        {
          label: 'Clicks',
          data: values,
          fill: true,
          tension: 0.4,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y} click${ctx.parsed.y !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Only show whole numbers on the Y axis
          precision: 0,
          stepSize: 1,
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Nothing selected yet
  if (!alias) {
    return (
      <section className="chart-section chart-section--empty">
        <p className="chart-placeholder">
          📊 Select a URL from the list to view its click analytics.
        </p>
      </section>
    );
  }

  return (
    <section className="chart-section">
      <div className="chart-header">
        <div className="chart-header__info">
          <h2 className="chart-title">Click Analytics</h2>
          {analytics && (
            <p className="chart-subtitle">
              <code className="chart-alias">{analytics.alias}</code>
              {' — '}
              <span className="chart-original">
                {analytics.original_url.length > 60
                  ? analytics.original_url.slice(0, 60) + '…'
                  : analytics.original_url}
              </span>
            </p>
          )}
        </div>
        <button
          className="chart-refresh-btn"
          onClick={loadAnalytics}
          disabled={loading}
          aria-label="Refresh analytics chart"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="chart-loading" role="status" aria-live="polite">
          <span className="chart-spinner" aria-hidden="true" />
          Loading analytics…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="chart-error" role="alert">
          <p>❌ {error}</p>
          <button className="chart-retry-btn" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && analytics && (
        <div className="chart-wrapper">
          <p className="chart-period">Last 7 days</p>
          <Line
            data={buildChartData(analytics)}
            options={chartOptions}
            aria-label={`Click analytics for ${analytics.alias}`}
          />
          <p className="chart-total">
            Total clicks in this period:{' '}
            <strong>
              {analytics.data.reduce((sum, p) => sum + p.clicks, 0)}
            </strong>
          </p>
        </div>
      )}
    </section>
  );
}
```

---

## File 2 — `AnalyticsChart.css`

```css
.chart-section {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}

.chart-section--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.chart-placeholder {
  color: #9ca3af;
  font-size: 0.9375rem;
  text-align: center;
}

/* Header row */
.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.chart-subtitle {
  font-size: 0.8125rem;
  color: #6b7280;
}

.chart-alias {
  font-family: monospace;
  font-weight: 700;
  color: #4f46e5;
}

.chart-original {
  word-break: break-all;
}

.chart-refresh-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f3f4f6;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}

.chart-refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.chart-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading */
.chart-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  padding: 2rem 0;
  justify-content: center;
}

.chart-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: chart-spin 0.7s linear infinite;
}

@keyframes chart-spin {
  to { transform: rotate(360deg); }
}

/* Error */
.chart-error {
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

.chart-retry-btn {
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

/* Chart wrapper */
.chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chart-period {
  font-size: 0.8125rem;
  color: #9ca3af;
  text-align: right;
}

.chart-total {
  font-size: 0.875rem;
  color: #374151;
  text-align: right;
  margin-top: 0.25rem;
}

.chart-total strong {
  color: #4f46e5;
}
```

---

## Acceptance Criteria

- [ ] When `alias` prop is `null`, the placeholder message is shown
- [ ] When `alias` is set, `fetchAnalytics` is called automatically
- [ ] A spinner is shown while fetching
- [ ] The line chart renders with exactly 7 data points on the X axis
- [ ] X axis labels show human-readable dates (`"May 13"` not `"2025-05-13"`)
- [ ] Y axis only shows whole numbers (`precision: 0`)
- [ ] Clicking "↻ Refresh" re-fetches and re-renders without a page reload
- [ ] The Refresh button is disabled while loading
- [ ] When a different alias is selected, the chart updates to show that alias's data
- [ ] Total clicks for the 7-day period is displayed below the chart
- [ ] If the fetch fails, an error banner with a Retry button is shown
- [ ] Chart.js components are registered at module level (not inside the component)

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `"CategoryScale" is not a registered scale` | Add `ChartJS.register(CategoryScale, ...)` at the top of the file |
| Chart does not update when alias changes | Include `alias` in the `useEffect` dependency array |
| Y axis shows decimals (0.5, 1.5…) | Set `ticks: { precision: 0, stepSize: 1 }` in scale options |
| Date labels show wrong day | Append `T00:00:00` when constructing `new Date(point.date)` to avoid UTC offset shift |
| Chart stretches outside its container | Set `maintainAspectRatio: true` and constrain the parent `div` width |
| `fetchAnalytics` called with `null` on first render | Guard with `if (!alias) return` at the top of `loadAnalytics` |
