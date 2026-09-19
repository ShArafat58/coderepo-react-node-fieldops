const API_URL = import.meta.env.VITE_API_URL || "/api/v1";
const TOKEN_KEY = "fieldops-token";

export function getToken() {
	return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
	if (token) localStorage.setItem(TOKEN_KEY, token);
	else localStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
	return Boolean(getToken());
}

async function request(path, options = {}) {
	const token = getToken();
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});
	if (response.status === 204) return null;
	const body = await response.json().catch(() => ({}));
	if (!response.ok) {
		if (response.status === 401) {
			setToken("");
			window.dispatchEvent(new CustomEvent("fieldops-session-expired", { detail: body?.error?.message }));
		}
		throw new Error(body?.error?.message || "Something went wrong. Please try again.");
	}
	return body.data;
}

export const apiClient = {
	get: (path) => request(path, { method: "GET" }),
	post: (path, payload) => request(path, { method: "POST", body: JSON.stringify(payload) }),
	patch: (path, payload) => request(path, { method: "PATCH", body: JSON.stringify(payload) }),
	remove: (path) => request(path, { method: "DELETE" }),
};
