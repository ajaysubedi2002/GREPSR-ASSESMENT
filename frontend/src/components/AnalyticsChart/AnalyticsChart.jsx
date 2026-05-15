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

	if (!alias) {
		return (
			<section className="chart-section chart-section--empty">
				<p className="chart-placeholder">
					Select a URL from the list to view its click analytics.
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
							{' - '}
							<span className="chart-original">
								{analytics.original_url.length > 60
									? analytics.original_url.slice(0, 60) + '...'
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
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			{loading && (
				<div className="chart-loading" role="status" aria-live="polite">
					<span className="chart-spinner" aria-hidden="true" />
					Loading analytics...
				</div>
			)}

			{!loading && error && (
				<div className="chart-error" role="alert">
					<p>Error: {error}</p>
					<button className="chart-retry-btn" onClick={loadAnalytics}>
						Retry
					</button>
				</div>
			)}

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
