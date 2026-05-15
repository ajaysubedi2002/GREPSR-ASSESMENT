import { useState, useCallback } from 'react';
import ShortenForm from './components/ShortenForm/ShortenForm.jsx';
import URLList from './components/URLList/URLList.jsx';
import AnalyticsChart from './components/AnalyticsChart/AnalyticsChart.jsx';
import './App.css';

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
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          {/* <span className="app-logo">🔗 Snip</span> */}
          <span className="app-tagline">Rate-limited URL shortener with analytics</span>
        </div>
      </header>

      <main className="app-main">
        <section className="app-card">
          <ShortenForm onSuccess={handleNewURL} />
        </section>

        <div className="app-dashboard">
          <div className="app-card app-card--list">
            <URLList
              onSelect={handleSelectAlias}
              selectedAlias={selectedAlias}
              refreshTrigger={refreshTrigger}
            />
          </div>

          <div className="app-card app-card--chart">
            <AnalyticsChart alias={selectedAlias} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Grepsr Assessment - Django REST + React - Built with Chart.js</p>
      </footer>
    </div>
  );
}
