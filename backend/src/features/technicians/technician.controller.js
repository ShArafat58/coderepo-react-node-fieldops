import { z } from "zod";
import { technicianService } from "./technician.service.js";

const workingHoursSchema = z.object({
	daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7),
	startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
	endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.email().max(254),
	password: z.string().min(8).max(200),
	skills: z.array(z.string().trim().min(1).max(100)).max(20),
	workingHours: workingHoursSchema,
});
const updateSchema = z.object({
	skills: z.array(z.string().trim().min(1).max(100)).max(20),
	workingHours: workingHoursSchema,
	active: z.boolean(),
}).partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export async function listTechnicians(request, response, next) {
	try {
		response.json({ data: await technicianService.list() });
	} catch (error) {
		next(error);
	}
}
export async function createTechnician(request, response, next) {
	try {
		response.status(201).json({ data: await technicianService.create(createSchema.parse(request.body)) });
	} catch (error) {
		next(error);
	}
}
export async function updateTechnician(request, response, next) {
	try {
		response.json({ data: await technicianService.update(request.params.technicianId, updateSchema.parse(request.body)) });
	} catch (error) {
		next(error);
	}
}
