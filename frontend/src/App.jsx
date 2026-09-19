import { useCallback, useEffect, useState } from "react";
import { authApi } from "./features/auth/auth.api.js";
import { Login } from "./features/auth/Login.jsx";
import { CustomerList } from "./features/customers/CustomerList.jsx";
import { Dashboard } from "./features/dashboard/Dashboard.jsx";
import { JobList } from "./features/jobs/JobList.jsx";
import { ServiceCatalog } from "./features/service-catalog/ServiceCatalog.jsx";
import { TechnicianList } from "./features/technicians/TechnicianList.jsx";
import { hasToken, setToken } from "./shared/api/client.js";

function AppBootScreen() {
	return (
		<main className="app-boot" aria-label="Opening FieldOps" role="status">
			<div className="app-boot-brand">
				<span className="brand-mark">F</span>
				<strong>FieldOps</strong>
			</div>
			<div className="app-boot-progress" aria-hidden="true">
				<span />
			</div>
		</main>
	);
}

function UserAvatar({ name }) {
	const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
	return <span className="user-avatar" aria-hidden="true">{initials}</span>;
}

function TechnicianOverview({ user }) {
	const stats = [
		{ label: "Your role", value: "Technician" },
		{ label: "Account status", value: "Active" },
		{ label: "Signed in as", value: user.email },
	];
	return (
		<div className="overview-view">
			<h2 className="section-title">Welcome back, {user.name.split(" ")[0]}</h2>
			<p className="overview-subtitle">Check the Jobs tab for your assigned work.</p>
			<div className="stat-cards">
				{stats.map((stat) => (
					<div className="stat-card" key={stat.label}>
						<span className="stat-label">{stat.label}</span>
						<span className="stat-value">{stat.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}

const NAV_ITEMS = [
	{ id: "overview", label: "Overview", roles: ["admin", "technician"] },
	{ id: "jobs", label: "Jobs", roles: ["admin", "technician"] },
	{ id: "customers", label: "Customers", roles: ["admin", "technician"] },
	{ id: "services", label: "Services", roles: ["admin", "technician"] },
	{ id: "technicians", label: "Technicians", roles: ["admin"] },
];

function DashboardShell({ user, onLogout }) {
	const [view, setView] = useState("overview");
	const [menuOpen, setMenuOpen] = useState(false);
	const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

	const selectView = (id) => {
		setView(id);
		setMenuOpen(false);
	};

	return (
		<main className="dashboard-shell">
			<header className="dashboard-header">
				<div className="header-left">
					<button aria-expanded={menuOpen} aria-label="Toggle menu" className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button">
						<span />
						<span />
						<span />
					</button>
					<div className="app-boot-brand">
						<span className="brand-mark">F</span>
						<strong>FieldOps</strong>
					</div>
				</div>
				<nav className="dashboard-nav">
					{visibleItems.map((item) => (
						<button className={view === item.id ? "active" : ""} key={item.id} onClick={() => selectView(item.id)} type="button">{item.label}</button>
					))}
				</nav>
				<div className="dashboard-user">
					<UserAvatar name={user.name} />
					<span className="dashboard-user-info">
						<strong>{user.name}</strong>
						<span className="dashboard-user-role">{user.role}</span>
					</span>
					<button className="sign-out-button" onClick={onLogout} type="button">Sign out</button>
				</div>
			</header>
			{menuOpen && (
				<>
					<button aria-label="Close menu" className="mobile-nav-scrim" onClick={() => setMenuOpen(false)} type="button" />
					<nav className="mobile-nav-drawer">
						{visibleItems.map((item) => (
							<button className={view === item.id ? "active" : ""} key={item.id} onClick={() => selectView(item.id)} type="button">{item.label}</button>
						))}
						<div className="mobile-nav-divider" />
						<button className="mobile-nav-user" onClick={onLogout} type="button">Sign out ({user.name})</button>
					</nav>
				</>
			)}
			<div className="dashboard-body">
				{view === "overview" && (user.role === "admin" ? <Dashboard /> : <TechnicianOverview user={user} />)}
				{view === "jobs" && <JobList canCreate={user.role === "admin"} />}
				{view === "customers" && <CustomerList canManage={user.role === "admin"} />}
				{view === "services" && <ServiceCatalog canManage={user.role === "admin"} />}
				{view === "technicians" && user.role === "admin" && <TechnicianList canManage={user.role === "admin"} />}
			</div>
		</main>
	);
}

export default function App() {
	const [user, setUser] = useState(null);
	const [bootstrapping, setBootstrapping] = useState(true);
	const [authLoading, setAuthLoading] = useState(false);
	const [authError, setAuthError] = useState("");

	useEffect(() => {
		const expire = (event) => {
			setToken("");
			setUser(null);
			setAuthError(event.detail || "Your session has expired.");
		};
		window.addEventListener("fieldops-session-expired", expire);
		return () => window.removeEventListener("fieldops-session-expired", expire);
	}, []);

	useEffect(() => {
		let active = true;
		const restore = async () => {
			if (!hasToken()) {
				if (active) setBootstrapping(false);
				return;
			}
			try {
				const result = await authApi.session();
				if (!active) return;
				setUser(result.user);
			} catch {
				setToken("");
			} finally {
				if (active) setBootstrapping(false);
			}
		};
		restore();
		return () => { active = false; };
	}, []);

	const login = useCallback(async (email, password) => {
		try {
			setAuthLoading(true);
			setAuthError("");
			const result = await authApi.login(email, password);
			setToken(result.token);
			setUser(result.user);
		} catch (error) {
			setAuthError(error.message);
		} finally {
			setAuthLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			if (hasToken()) await authApi.logout();
		} catch {}
		setToken("");
		setUser(null);
	}, []);

	if (bootstrapping) return <AppBootScreen />;
	if (!user) return <Login error={authError} loading={authLoading} onLogin={login} />;
	return <DashboardShell onLogout={logout} user={user} />;
}