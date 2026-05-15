import { useState, useEffect, useCallback } from 'react';
import { fetchAllURLs } from '../../api/api.js';
import './URLList.css';

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
    <section className="url-list-section">
      <div className="url-list-header">
        <h2 className="url-list-title">All Shortened URLs</h2>
        <button
          className="url-list-refresh"
          onClick={loadURLs}
          disabled={loading}
          aria-label="Refresh URL list"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="url-list-loading" role="status" aria-live="polite">
          <span className="url-list-spinner" aria-hidden="true" />
          Loading URLs...
        </div>
      )}

      {!loading && error && (
        <div className="url-list-error" role="alert">
          <p>Error: {error}</p>
          <button className="url-list-retry" onClick={loadURLs}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && urls.length === 0 && (
        <p className="url-list-empty">
          No URLs shortened yet. Use the form above to get started.
        </p>
      )}

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
