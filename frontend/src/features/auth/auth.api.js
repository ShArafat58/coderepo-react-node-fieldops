import { apiClient } from "../../shared/api/client.js";

export const authApi = {
	login: (email, password) => apiClient.post("/auth/login", { email, password }),
	session: () => apiClient.get("/auth/session"),
	logout: () => apiClient.post("/auth/logout", {}),
};
