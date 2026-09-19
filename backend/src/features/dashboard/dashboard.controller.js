import { dashboardService } from "./dashboard.service.js";

export async function getSummary(request, response, next) {
	try {
		response.json({ data: await dashboardService.summary() });
	} catch (error) {
		next(error);
	}
}
