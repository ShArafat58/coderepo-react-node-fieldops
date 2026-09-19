import { apiClient } from "../../shared/api/client.js";

export const technicianApi = {
	list: () => apiClient.get("/technicians"),
	create: (payload) => apiClient.post("/technicians", payload),
	update: (id, payload) => apiClient.patch(`/technicians/${id}`, payload),
};
