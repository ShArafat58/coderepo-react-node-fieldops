import { z } from "zod";
import { serviceTypeService } from "./service-type.service.js";

const serviceTypeFields = {
	name: z.string().trim().min(1).max(120),
	description: z.string().max(500),
	estimatedDurationMinutes: z.number().int().min(5).max(1440),
	basePrice: z.number().min(0),
};
const createSchema = z.object({ ...serviceTypeFields, description: serviceTypeFields.description.default("") });
const updateSchema = z.object({ ...serviceTypeFields, active: z.boolean() }).partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export async function listServiceTypes(request, response, next) {
	try {
		const data = request.user.role === "admin" ? await serviceTypeService.list() : await serviceTypeService.listActive();
		response.json({ data });
	} catch (error) {
		next(error);
	}
}
export async function createServiceType(request, response, next) {
	try {
		response.status(201).json({ data: await serviceTypeService.create(createSchema.parse(request.body)) });
	} catch (error) {
		next(error);
	}
}
export async function updateServiceType(request, response, next) {
	try {
		response.json({ data: await serviceTypeService.update(request.params.serviceTypeId, updateSchema.parse(request.body)) });
	} catch (error) {
		next(error);
	}
}
export async function deleteServiceType(request, response, next) {
	try {
		await serviceTypeService.remove(request.params.serviceTypeId);
		response.status(204).send();
	} catch (error) {
		next(error);
	}
}
