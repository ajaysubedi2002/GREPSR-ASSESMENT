import { useState, useCallback } from 'react';
import ShortenForm from './components/ShortenForm/ShortenForm.jsx';
import URLList from './components/URLList/URLList.jsx';
import AnalyticsChart from './components/AnalyticsChart/AnalyticsChart.jsx';

export default function App() {
  const [selectedAlias, setSelectedAlias] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewURL = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleSelectAlias = useCallback((alias) => {
    setSelectedAlias(alias);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/95 shadow-soft backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Grepsr Link Lab
              </p>
              <p className="text-xs text-slate-300">
                Rate-limited URL shortener with analytics
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Live insights
            </span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur-sm">
            <ShortenForm onSuccess={handleNewURL} />
          </section>

          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur-sm">
              <URLList
                onSelect={handleSelectAlias}
                selectedAlias={selectedAlias}
                refreshTrigger={refreshTrigger}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur-sm">
              <AnalyticsChart alias={selectedAlias} />
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500">
          Grepsr Assessment - Django REST + React - Built with Chart.js
        </footer>
      </div>
    </div>
  );
}
