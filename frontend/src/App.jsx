import { useCallback, useEffect, useState } from "react";
import { authApi } from "./features/auth/auth.api.js";
import { Login } from "./features/auth/Login.jsx";
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

function Dashboard({ user, onLogout }) {
	return (
		<main className="dashboard-shell">
			<header className="dashboard-header">
				<div className="app-boot-brand">
					<span className="brand-mark">F</span>
					<strong>FieldOps</strong>
				</div>
				<div className="dashboard-user">
					<span>{user.name} · {user.role}</span>
					<button onClick={onLogout} type="button">Sign out</button>
				</div>
			</header>
			<div className="dashboard-body">
				<p>Signed in as {user.email}. More features are on the way.</p>
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
	return <Dashboard onLogout={logout} user={user} />;
}