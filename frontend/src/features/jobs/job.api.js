import { apiClient } from "../../shared/api/client.js";

export const jobApi = {
	list: () => apiClient.get("/jobs"),
	get: (id) => apiClient.get(`/jobs/${id}`),
	create: (payload) => apiClient.post("/jobs", payload),
	updateStatus: (id, status, note) => apiClient.patch(`/jobs/${id}/status`, { status, ...(note ? { note } : {}) }),
};
