import { useState, useEffect, useCallback } from 'react';
import { fetchAllURLs } from '../../api/api.js';

/**
 * URLList
 *
 * Props:
 *   onSelect (function) - called with the alias string when a URL is clicked
 *   selectedAlias (string) - the currently selected alias (for highlight styling)
 *   refreshTrigger (any) - change this value from the parent to trigger a re-fetch
 */
export default function URLList({ onSelect, selectedAlias, refreshTrigger }) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            All shortened URLs
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        </div>
        <button
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={loadURLs}
          disabled={loading}
          aria-label="Refresh URL list"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500" role="status" aria-live="polite">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" aria-hidden="true" />
          Loading URLs...
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <p>Error: {error}</p>
          <button className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white" onClick={loadURLs}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && urls.length === 0 && (
        <p className="text-sm text-slate-500">
          No URLs shortened yet. Use the form above to get started.
        </p>
      )}

      {!loading && !error && urls.length > 0 && (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto" role="list">
          {urls.map(url => (
            <li key={url.id}>
              <button
                className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-emerald-200 hover:bg-emerald-50 ${
                  selectedAlias === url.alias ? 'border-emerald-500 bg-emerald-50' : ''
                }`}
                onClick={() => onSelect(url.alias)}
                aria-pressed={selectedAlias === url.alias}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-emerald-600">{url.alias}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {url.total_clicks} click{url.total_clicks !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-1 break-all text-xs text-slate-700">
                  {truncate(url.original_url)}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
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
