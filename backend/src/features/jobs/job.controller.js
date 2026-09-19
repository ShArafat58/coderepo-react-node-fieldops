import { z } from "zod";
import { jobService } from "./job.service.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);
const createSchema = z.object({
	customerId: objectIdSchema,
	propertyId: objectIdSchema,
	serviceTypeId: objectIdSchema,
	scheduledStartAt: z.coerce.date().nullable().optional(),
	scheduledEndAt: z.coerce.date().nullable().optional(),
	price: z.number().min(0).nullable().optional(),
}).refine((value) => !value.scheduledStartAt || !value.scheduledEndAt || value.scheduledStartAt < value.scheduledEndAt, { message: "End time must be after start time.", path: ["scheduledEndAt"] });
const statusSchema = z.object({
	status: z.enum(["requested", "scheduled", "en_route", "in_progress", "completed", "invoiced", "cancelled"]),
	note: z.string().max(2000).optional(),
}).strict();
const detailsSchema = z.object({
	scheduledStartAt: z.coerce.date().nullable(),
	scheduledEndAt: z.coerce.date().nullable(),
	price: z.number().min(0).nullable(),
}).partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
const assignSchema = z.object({ technicianId: objectIdSchema }).strict();

export async function listJobs(request, response, next) {
	try {
		response.json({ data: await jobService.list(request.user) });
	} catch (error) {
		next(error);
	}
}
export async function getJob(request, response, next) {
	try {
		response.json({ data: await jobService.getById(request.params.jobId) });
	} catch (error) {
		next(error);
	}
}
export async function createJob(request, response, next) {
	try {
		response.status(201).json({ data: await jobService.create(createSchema.parse(request.body), request.user) });
	} catch (error) {
		next(error);
	}
}
export async function assignTechnician(request, response, next) {
	try {
		const { technicianId } = assignSchema.parse(request.body);
		response.json({ data: await jobService.assign(request.params.jobId, technicianId, request.user) });
	} catch (error) {
		next(error);
	}
}
export async function updateJobStatus(request, response, next) {
	try {
		const { status, note } = statusSchema.parse(request.body);
		response.json({ data: await jobService.updateStatus(request.params.jobId, status, note, request.user) });
	} catch (error) {
		next(error);
	}
}
export async function updateJobDetails(request, response, next) {
	try {
		response.json({ data: await jobService.updateDetails(request.params.jobId, detailsSchema.parse(request.body)) });
	} catch (error) {
		next(error);
	}
}
