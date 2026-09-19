import { useCallback, useEffect, useState } from "react";
import { BarChart } from "./BarChart.jsx";
import { StatusDonut } from "./StatusDonut.jsx";
import { dashboardApi } from "./dashboard.api.js";

const STAT_ICONS = { total: "📋", today: "📅", unscheduled: "⏳" };

export function Dashboard() {
	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			setSummary(await dashboardApi.summary());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	if (loading) {
		return (
			<div className="customers-loading" aria-label="Loading dashboard" role="status">
				{Array.from({ length: 4 }, (_, index) => <div className="customers-loading-row" key={index} />)}
			</div>
		);
	}
	if (error) {
		return <div className="service-error" role="alert"><span>{error}</span><button onClick={load} type="button">Retry</button></div>;
	}

	return (
		<div className="overview-view">
			<h2 className="section-title">Operations dashboard</h2>
			<p className="overview-subtitle">A live snapshot of jobs, revenue, and technician workload.</p>
			<div className="stat-cards">
				<div className="stat-card stat-card-accent">
					<span className="stat-icon">{STAT_ICONS.total}</span>
					<div>
						<span className="stat-label">Total jobs</span>
						<span className="stat-value">{summary.totalJobs}</span>
					</div>
				</div>
				<div className="stat-card stat-card-accent">
					<span className="stat-icon">{STAT_ICONS.today}</span>
					<div>
						<span className="stat-label">Scheduled today</span>
						<span className="stat-value">{summary.todayCount}</span>
					</div>
				</div>
				<div className="stat-card stat-card-accent">
					<span className="stat-icon">{STAT_ICONS.unscheduled}</span>
					<div>
						<span className="stat-label">Unscheduled requests</span>
						<span className="stat-value">{summary.unscheduledCount}</span>
					</div>
				</div>
			</div>
			<div className="dashboard-grid-main">
				<div className="dashboard-panel dashboard-panel-large">
					<h3>Jobs by status</h3>
					<StatusDonut statusCounts={summary.statusCounts} total={summary.totalJobs} />
				</div>
				<div className="dashboard-grid-side">
					<div className="dashboard-panel">
						<h3>Revenue by service</h3>
						{summary.revenueByService.length === 0 ? (
							<p className="detail-empty">No completed or invoiced jobs yet.</p>
						) : (
							<BarChart colors={["#34a853", "#4285f4", "#fbbc04", "#ea4335", "#a142f4"]} data={summary.revenueByService.map((row) => ({ label: row.name, value: row.revenue }))} valueFormatter={(value) => `$${value.toFixed(0)}`} />
						)}
					</div>
					<div className="dashboard-panel">
						<h3>Technician utilization (this week)</h3>
						{summary.utilization.length === 0 ? (
							<p className="detail-empty">No active technicians.</p>
						) : (
							<BarChart colors={["#4285f4", "#a142f4", "#24c1e0"]} data={summary.utilization.map((row) => ({ label: row.name, value: row.utilizationPercent }))} valueFormatter={(value) => `${value}%`} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
