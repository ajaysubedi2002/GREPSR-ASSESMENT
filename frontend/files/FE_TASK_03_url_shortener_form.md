# FE TASK 03 — URL Shortener Form + 429 Countdown Timer

## Goal
Build `ShortenForm` — the input form that lets users shorten a URL. When the
backend returns a 429 rate-limit error, the form must display a live countdown
timer and disable the submit button until the cooldown expires.

---

## Files to Create

1. **`frontend/src/components/ShortenForm/ShortenForm.jsx`**
2. **`frontend/src/components/ShortenForm/ShortenForm.css`**

---

## Component Behaviour

```
States:
  idle       → input enabled, button reads "Shorten"
  loading    → input disabled, button reads "Shortening…"
  success    → result box shows alias + copyable short URL, input resets
  error      → red error banner (validation / network failure)
  rate_limited → input disabled, button reads "Try again in Xs" and counts down
                 When countdown reaches 0 → returns to idle state automatically
```

---

## File 1 — `ShortenForm.jsx`

```jsx
import { useState, useEffect, useRef } from 'react';
import { shortenURL } from '../../api/api.js';
import './ShortenForm.css';

/**
 * ShortenForm
 *
 * Props:
 *   onSuccess (function) — called with the new URL object after a successful
 *                          shorten so the parent can refresh the URL list.
 */
export default function ShortenForm({ onSuccess }) {
  const [inputURL, setInputURL]         = useState('');
  const [status, setStatus]             = useState('idle'); // idle | loading | success | error | rate_limited
  const [result, setResult]             = useState(null);   // the shortened URL object from the API
  const [errorMsg, setErrorMsg]         = useState('');
  const [countdown, setCountdown]       = useState(0);      // seconds remaining in rate-limit cooldown
  const countdownRef                    = useRef(null);      // holds the setInterval ID

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
  }, [status]); // only re-run when status changes (not every countdown tick)

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
        // DRF returns field errors as { url: ["message"] }
        const messages = Object.values(data).flat().join(' ');
        setErrorMsg(messages || 'Invalid request. Please check your URL.');
        setStatus('error');

      } else {
        setErrorMsg('Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error — is the backend running?');
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
          {status === 'loading'      && 'Shortening…'}
          {status === 'rate_limited' && `Try again in ${countdown}s`}
          {(status === 'idle' || status === 'success' || status === 'error') && 'Shorten'}
        </button>
      </form>

      {/* Rate limit banner */}
      {status === 'rate_limited' && (
        <div className="shorten-banner shorten-banner--warning" role="alert">
          ⏳ Rate limit reached. You can shorten 5 URLs per minute.
          Please wait <strong>{countdown} second{countdown !== 1 ? 's' : ''}</strong>.
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && (
        <div className="shorten-banner shorten-banner--error" role="alert">
          ❌ {errorMsg}
        </div>
      )}

      {/* Success result */}
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
```

---

## File 2 — `ShortenForm.css`

```css
.shorten-form-section {
  margin-bottom: 2rem;
}

.shorten-form-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1a1a2e;
}

.shorten-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.shorten-input {
  flex: 1;
  min-width: 260px;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s;
}

.shorten-input:focus {
  border-color: #4f46e5;
}

.shorten-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.shorten-btn {
  padding: 0.625rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.shorten-btn:hover:not(:disabled) {
  background: #4338ca;
}

.shorten-btn--disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Banners */
.shorten-banner {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.shorten-banner--warning {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
}

.shorten-banner--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

/* Success result row */
.shorten-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.shorten-result__label {
  font-size: 0.875rem;
  color: #166534;
  font-weight: 500;
}

.shorten-result__link {
  font-size: 0.9rem;
  color: #15803d;
  text-decoration: underline;
  word-break: break-all;
}

.shorten-result__copy {
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-left: auto;
}

.shorten-result__copy:hover {
  background: #15803d;
}
```

---

## State Machine Summary

```
idle ──[submit]──► loading ──[201]──► success
                         └──[400]──► error
                         └──[429]──► rate_limited ──[countdown=0]──► idle
                         └──[throw]─► error
```

---

## Acceptance Criteria

- [ ] Submitting a valid URL shows the short URL in a green result box
- [ ] The result box includes a working "Copy" button
- [ ] `onSuccess` prop is called after a 201 response
- [ ] Submitting with an empty input shows an error banner without calling the API
- [ ] After a 429 response, the button shows `"Try again in Xs"` and counts down
- [ ] The countdown decrements every second using `setInterval`
- [ ] When the countdown reaches 0, the form returns to `idle` automatically
- [ ] The input and button are disabled during `loading` and `rate_limited` states
- [ ] The input clears after a successful shortening
- [ ] A network error (backend down) shows a friendly error message
- [ ] No console errors or unhandled promise rejections

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| Countdown interval not cleared on unmount | Return `clearInterval` from the `useEffect` cleanup |
| Countdown ticks but status never resets | In `setCountdown` callback, call `setStatus('idle')` when `prev <= 1` |
| `onSuccess` called with undefined | Only call `if (onSuccess) onSuccess(data)` — guard for missing prop |
| Copy button does nothing on HTTP | `navigator.clipboard` only works on HTTPS or localhost |
| Button stays disabled after 429 | Ensure `setStatus('idle')` is called when countdown reaches 0 |
| Form submits on Enter without `handleSubmit` guard | Attach `onSubmit` to the `<form>` not `onClick` on the button |
