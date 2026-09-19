import { apiClient } from "../../shared/api/client.js";

export const customerApi = {
	list: () => apiClient.get("/customers"),
	get: (id) => apiClient.get(`/customers/${id}`),
	create: (payload) => apiClient.post("/customers", payload),
	update: (id, payload) => apiClient.patch(`/customers/${id}`, payload),
	remove: (id) => apiClient.remove(`/customers/${id}`),
	createProperty: (customerId, payload) => apiClient.post(`/customers/${customerId}/properties`, payload),
	removeProperty: (propertyId) => apiClient.remove(`/properties/${propertyId}`),
};
