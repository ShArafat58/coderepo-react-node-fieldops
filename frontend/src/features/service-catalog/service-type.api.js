import { apiClient } from "../../shared/api/client.js";

export const serviceTypeApi = {
	list: () => apiClient.get("/service-types"),
	create: (payload) => apiClient.post("/service-types", payload),
	update: (id, payload) => apiClient.patch(`/service-types/${id}`, payload),
	remove: (id) => apiClient.remove(`/service-types/${id}`),
};
