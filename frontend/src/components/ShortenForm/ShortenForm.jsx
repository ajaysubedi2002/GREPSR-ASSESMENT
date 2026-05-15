import { useState, useEffect, useRef } from 'react';
import { shortenURL } from '../../api/api.js';
import './ShortenForm.css';

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
    <section className="shorten-form-section">
      <h2 className="shorten-form-title">Shorten a URL</h2>

      <form className="shorten-form" onSubmit={handleSubmit} noValidate>
        <input
          className="shorten-input"
          type="url"
          placeholder="https://example.com/very/long/path"
          value={inputURL}
          onChange={e => setInputURL(e.target.value)}
          disabled={isDisabled}
          aria-label="Long URL to shorten"
        />

        <button
          className={`shorten-btn ${isDisabled ? 'shorten-btn--disabled' : ''}`}
          type="submit"
          disabled={isDisabled}
        >
          {status === 'loading' && 'Shortening...'}
          {status === 'rate_limited' && `Try again in ${countdown}s`}
          {(status === 'idle' || status === 'success' || status === 'error') && 'Shorten'}
        </button>
      </form>

      {status === 'rate_limited' && (
        <div className="shorten-banner shorten-banner--warning" role="alert">
          Rate limit reached. You can shorten 5 URLs per minute.
          Please wait <strong>{countdown} second{countdown !== 1 ? 's' : ''}</strong>.
        </div>
      )}

      {status === 'error' && (
        <div className="shorten-banner shorten-banner--error" role="alert">
          Error: {errorMsg}
        </div>
      )}

      {status === 'success' && result && (
        <div className="shorten-result" role="status">
          <span className="shorten-result__label">Your short URL:</span>
          <a
            className="shorten-result__link"
            href={result.short_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.short_url}
          </a>
          <button className="shorten-result__copy" onClick={handleCopy}>
            Copy
          </button>
        </div>
      )}
    </section>
  );
}
