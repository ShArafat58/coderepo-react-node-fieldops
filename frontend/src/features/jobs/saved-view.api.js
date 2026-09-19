import { apiClient } from "../../shared/api/client.js";

export const savedViewApi = {
	list: () => apiClient.get("/saved-views"),
	create: (payload) => apiClient.post("/saved-views", payload),
	remove: (id) => apiClient.remove(`/saved-views/${id}`),
};
