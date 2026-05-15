import { useState, useEffect, useRef } from 'react';
import { shortenURL } from '../../api/api.js';

/**
 * ShortenForm
 *
 * Props:
 *   onSuccess (function) - called with the new URL object after a successful
 *                          shorten so the parent can refresh the URL list.
 */
export default function ShortenForm({ onSuccess }) {
  const [inputURL, setInputURL] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  // Clear the countdown interval when the component unmounts
  useEffect(() => {
    return () => clearInterval(countdownRef.current);
  }, []);

  // Start the countdown timer when we enter rate_limited state
  useEffect(() => {
    if (status !== 'rate_limited' || countdown <= 0) return;

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setStatus('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmed = inputURL.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a URL.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    setResult(null);

    try {
      const { status: httpStatus, data } = await shortenURL(trimmed);

      if (httpStatus === 201) {
        setResult(data);
        setInputURL('');
        setStatus('success');
        if (onSuccess) onSuccess(data);
      } else if (httpStatus === 429) {
        setCountdown(data.retry_after_seconds ?? 60);
        setStatus('rate_limited');
      } else if (httpStatus === 400) {
        const messages = Object.values(data).flat().join(' ');
        setErrorMsg(messages || 'Invalid request. Please check your URL.');
        setStatus('error');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error - is the backend running?');
      setStatus('error');
    }
  }

  function handleCopy() {
    if (result?.short_url) {
      navigator.clipboard.writeText(result.short_url);
    }
  }

  const isDisabled = status === 'loading' || status === 'rate_limited';

  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Shorten a URL
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">
          Create a compact link instantly
        </h2>
      </div>

      <form className="flex flex-wrap gap-2" onSubmit={handleSubmit} noValidate>
        <input
          className="min-w-[260px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          type="url"
          placeholder="https://example.com/very/long/path"
          value={inputURL}
          onChange={e => setInputURL(e.target.value)}
          disabled={isDisabled}
          aria-label="Long URL to shorten"
        />

        <button
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isDisabled}
        >
          {status === 'loading' && 'Shortening...'}
          {status === 'rate_limited' && `Try again in ${countdown}s`}
          {(status === 'idle' || status === 'success' || status === 'error') && 'Shorten'}
        </button>
      </form>

      {status === 'rate_limited' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          Rate limit reached. You can shorten 5 URLs per minute. Please wait{' '}
          <strong>{countdown} second{countdown !== 1 ? 's' : ''}</strong>.
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          Error: {errorMsg}
        </div>
      )}

      {status === 'success' && result && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          <span className="font-semibold">Your short URL:</span>
          <a
            className="break-all text-emerald-700 underline-offset-2 hover:underline"
            href={result.short_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.short_url}
          </a>
          <button
            className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
            onClick={handleCopy}
          >
            Copy
          </button>
        </div>
      )}
    </section>
  );
}
