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
import { fetchAnalytics, buildShortUrl } from '../../api/api.js';

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
 *   alias (string | null) - the selected URL alias; null means nothing is selected
 */
export default function AnalyticsChart({ alias }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (alias) {
      loadAnalytics();
    } else {
      setAnalytics(null);
      setError('');
    }
  }, [alias, loadAnalytics]);

  function buildChartData(analyticsData) {
    const labels = analyticsData.data.map(point => {
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
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          pointBackgroundColor: '#10b981',
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
          precision: 0,
          stepSize: 1,
        },
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  if (!alias) {
    return (
      <section className="flex min-h-[220px] items-center justify-center">
        <p className="text-center text-sm text-slate-400">
          Select a URL from the list to view its click analytics.
        </p>
      </section>
    );
  }

  const shortUrl = analytics?.short_url || (analytics ? buildShortUrl(analytics.alias) : '');

  function handleShortLinkClick() {
    if (!analytics) return;

    setAnalytics(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        data: prev.data.map((point, index) =>
          index === prev.data.length - 1
            ? { ...point, clicks: point.clicks + 1 }
            : point
        ),
      };
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Click analytics
          </p>
          {analytics && (
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-emerald-700">
                  {analytics.alias}
                </span>
                <span className="text-slate-400">Short link:</span>
                <a
                  className="break-all text-emerald-700 underline-offset-2 hover:underline"
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleShortLinkClick}
                >
                  {shortUrl}
                </a>
              </div>
              <div className="break-all">
                {analytics.original_url.length > 60
                  ? analytics.original_url.slice(0, 60) + '...'
                  : analytics.original_url}
              </div>
            </div>
          )}
        </div>
        <button
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={loadAnalytics}
          disabled={loading}
          aria-label="Refresh analytics chart"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500" role="status" aria-live="polite">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" aria-hidden="true" />
          Loading analytics...
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <p>Error: {error}</p>
          <button className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && analytics && (
        <div className="space-y-2">
          <p className="text-right text-xs uppercase tracking-wide text-slate-400">Last 7 days</p>
          <Line
            data={buildChartData(analytics)}
            options={chartOptions}
            aria-label={`Click analytics for ${analytics.alias}`}
          />
          <p className="text-right text-sm text-slate-600">
            Total clicks in this period:{' '}
            <strong className="text-emerald-700">
              {analytics.data.reduce((sum, p) => sum + p.clicks, 0)}
            </strong>
          </p>
        </div>
      )}
    </section>
  );
}
