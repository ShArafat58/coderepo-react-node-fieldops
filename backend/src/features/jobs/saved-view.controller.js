import { z } from "zod";
import { savedViewService } from "./saved-view.service.js";

const createSchema = z.object({
	name: z.string().trim().min(1).max(80),
	filters: z.object({
		status: z.string().max(20).default(""),
		technicianId: z.string().max(24).default(""),
		customerId: z.string().max(24).default(""),
		dateFrom: z.string().max(10).default(""),
		dateTo: z.string().max(10).default(""),
	}).default({}),
}).strict();

export async function listSavedViews(request, response, next) {
	try {
		response.json({ data: await savedViewService.list(request.user._id) });
	} catch (error) {
		next(error);
	}
}
export async function createSavedView(request, response, next) {
	try {
		response.status(201).json({ data: await savedViewService.create(request.user._id, createSchema.parse(request.body)) });
	} catch (error) {
		next(error);
	}
}
export async function deleteSavedView(request, response, next) {
	try {
		await savedViewService.remove(request.params.savedViewId, request.user._id);
		response.status(204).send();
	} catch (error) {
		next(error);
	}
}
