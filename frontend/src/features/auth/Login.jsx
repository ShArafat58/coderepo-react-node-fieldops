import { useState } from "react";

export function Login({ error, loading, onLogin }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!email || !password) return;
		onLogin(email, password);
	};

	return (
		<main className="login-screen">
			<form className="login-card" onSubmit={handleSubmit}>
				<div className="login-brand">
					<span className="brand-mark">F</span>
					<strong>FieldOps</strong>
				</div>
				<p className="login-subtitle">Sign in to manage jobs, customers, and technicians.</p>
				{error && <div className="login-error" role="alert">{error}</div>}
				<label className="login-field">
					<span>Email</span>
					<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
				</label>
				<label className="login-field">
					<span>Password</span>
					<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
				</label>
				<button className="login-submit" disabled={loading} type="submit">{loading ? "Signing in…" : "Sign in"}</button>
			</form>
		</main>
	);
}
