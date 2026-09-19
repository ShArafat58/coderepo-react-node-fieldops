import { apiClient } from "../../shared/api/client.js";

export const jobApi = {
	list: () => apiClient.get("/jobs"),
	get: (id) => apiClient.get(`/jobs/${id}`),
	create: (payload) => apiClient.post("/jobs", payload),
	assign: (id, technicianId) => apiClient.patch(`/jobs/${id}/assign`, { technicianId }),
	updateStatus: (id, status, note) => apiClient.patch(`/jobs/${id}/status`, { status, ...(note ? { note } : {}) }),
	updateDetails: (id, payload) => apiClient.patch(`/jobs/${id}`, payload),
};
