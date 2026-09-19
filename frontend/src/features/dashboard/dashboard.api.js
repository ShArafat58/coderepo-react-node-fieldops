import { apiClient } from "../../shared/api/client.js";

export const dashboardApi = {
	summary: () => apiClient.get("/dashboard/summary"),
};
