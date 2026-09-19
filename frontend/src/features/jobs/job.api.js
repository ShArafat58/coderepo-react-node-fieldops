import { apiClient } from "../../shared/api/client.js";

function toQueryString(filters) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value) params.set(key, value);
	}
	const query = params.toString();
	return query ? `?${query}` : "";
}

export const jobApi = {
	list: (filters = {}) => apiClient.get(`/jobs${toQueryString(filters)}`),
	get: (id) => apiClient.get(`/jobs/${id}`),
	create: (payload) => apiClient.post("/jobs", payload),
	assign: (id, technicianId) => apiClient.patch(`/jobs/${id}/assign`, { technicianId }),
	updateStatus: (id, status, note) => apiClient.patch(`/jobs/${id}/status`, { status, ...(note ? { note } : {}) }),
	updateDetails: (id, payload) => apiClient.patch(`/jobs/${id}`, payload),
};
