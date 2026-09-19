import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { customerRepository } from "../customers/customer.repository.js";
import { propertyRepository } from "../customers/property.repository.js";
import { serviceTypeRepository } from "../service-catalog/service-type.repository.js";
import { technicianRepository } from "../technicians/technician.repository.js";
import { jobRepository } from "./job.repository.js";
import { jobStatusHistoryRepository } from "./job-status-history.repository.js";

const VALID_TRANSITIONS = {
	requested: ["scheduled", "cancelled"],
	scheduled: ["en_route", "cancelled"],
	en_route: ["in_progress", "cancelled"],
	in_progress: ["completed", "cancelled"],
	completed: ["invoiced"],
	invoiced: [],
	cancelled: [],
};

const DAY_MINUTES = 24 * 60;

function ensureObjectId(id) {
	if (!mongoose.isValidObjectId(id)) throw new AppError(404, "JOB_NOT_FOUND", "The requested job does not exist.");
}

async function ensureReferences(input) {
	if (!mongoose.isValidObjectId(input.customerId) || !(await customerRepository.findById(input.customerId))) {
		throw new AppError(422, "INVALID_CUSTOMER", "The selected customer does not exist.");
	}
	const property = mongoose.isValidObjectId(input.propertyId) ? await propertyRepository.findById(input.propertyId) : null;
	if (!property) throw new AppError(422, "INVALID_PROPERTY", "The selected property does not exist.");
	if (String(property.customerId) !== String(input.customerId)) {
		throw new AppError(422, "PROPERTY_CUSTOMER_MISMATCH", "The selected property does not belong to the selected customer.");
	}
	if (!mongoose.isValidObjectId(input.serviceTypeId) || !(await serviceTypeRepository.findById(input.serviceTypeId))) {
		throw new AppError(422, "INVALID_SERVICE_TYPE", "The selected service type does not exist.");
	}
}

const TIMEZONE_OFFSET_MINUTES = 6 * 60;

function minutesSinceMidnightLocal(date) {
	const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
	return ((utcMinutes + TIMEZONE_OFFSET_MINUTES) % DAY_MINUTES + DAY_MINUTES) % DAY_MINUTES;
}

function localDayOfWeek(date) {
	const utcDay = date.getUTCDay();
	const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
	const shifted = utcMinutes + TIMEZONE_OFFSET_MINUTES;
	const dayOffset = Math.floor(shifted / DAY_MINUTES);
	return (utcDay + dayOffset + 7) % 7;
}

function timeStringToMinutes(value) {
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

function isWithinWorkingHours(technician, startAt, endAt) {
	const start = new Date(startAt);
	const end = new Date(endAt);
	const startDay = localDayOfWeek(start);
	const endDay = localDayOfWeek(end);
	if (!technician.workingHours.daysOfWeek.includes(startDay) || (startDay !== endDay && !technician.workingHours.daysOfWeek.includes(endDay))) {
		return false;
	}
	const windowStart = timeStringToMinutes(technician.workingHours.startTime);
	const windowEnd = timeStringToMinutes(technician.workingHours.endTime);
	const jobStart = minutesSinceMidnightLocal(start);
	const jobEnd = startDay === endDay ? minutesSinceMidnightLocal(end) : DAY_MINUTES;
	return jobStart >= windowStart && jobEnd <= windowEnd;
}

async function ensureAssignable(technicianId, startAt, endAt, excludeJobId) {
	if (!mongoose.isValidObjectId(technicianId)) throw new AppError(422, "INVALID_TECHNICIAN", "The selected technician does not exist.");
	const technician = await technicianRepository.findById(technicianId);
	if (!technician) throw new AppError(422, "INVALID_TECHNICIAN", "The selected technician does not exist.");
	if (!startAt || !endAt) throw new AppError(400, "SCHEDULE_REQUIRED", "Set a scheduled start and end time before assigning a technician.");
	if (!technician.userId.active) throw new AppError(422, "TECHNICIAN_INACTIVE", "This technician's account is inactive.");

	const overlapping = await jobRepository.findOverlapping(technicianId, new Date(startAt), new Date(endAt), excludeJobId);
	if (overlapping.length > 0) {
		throw new AppError(409, "SCHEDULING_CONFLICT", "This technician is already assigned to another job during this time window.");
	}
	if (!isWithinWorkingHours(technician, startAt, endAt)) {
		throw new AppError(409, "OUTSIDE_WORKING_HOURS", "This time falls outside the technician's working hours.");
	}
	return technician;
}

export const jobService = {
	async list(user) {
		if (user.role === "technician") {
			const technician = await technicianRepository.findByUserId(user._id);
			if (!technician) return [];
			return jobRepository.findByTechnicianId(technician._id);
		}
		return jobRepository.findAll();
	},
	async getById(id) {
		ensureObjectId(id);
		const job = await jobRepository.findById(id);
		if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job does not exist.");
		const history = await jobStatusHistoryRepository.findByJobId(id);
		return { ...job, history };
	},
	async create(input, user) {
		await ensureReferences(input);
		const serviceType = await serviceTypeRepository.findById(input.serviceTypeId);
		const job = await jobRepository.create({
			...input,
			price: input.price ?? serviceType.basePrice,
			createdBy: user._id,
		});
		await jobStatusHistoryRepository.create({ jobId: job._id, fromStatus: null, toStatus: "requested", changedBy: user._id, note: "Job created." });
		return jobRepository.findById(job._id);
	},
	async assign(id, technicianId, user) {
		ensureObjectId(id);
		const job = await jobRepository.findById(id);
		if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job does not exist.");
		if (!["requested", "scheduled"].includes(job.status)) {
			throw new AppError(400, "JOB_LOCKED", "This job can no longer be reassigned because work has started.");
		}
		const technician = await ensureAssignable(technicianId, job.scheduledStartAt, job.scheduledEndAt, id);
		const updated = await jobRepository.update(id, { technicianId, status: "scheduled" });
		await jobStatusHistoryRepository.create({ jobId: id, fromStatus: job.status, toStatus: "scheduled", changedBy: user._id, note: `Assigned to ${technician.userId.name}.` });
		return jobRepository.findById(updated._id);
	},
	async updateStatus(id, toStatus, note, user) {
		ensureObjectId(id);
		const job = await jobRepository.findById(id);
		if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job does not exist.");
		const fromStatus = job.status;
		const allowed = VALID_TRANSITIONS[fromStatus] || [];
		if (!allowed.includes(toStatus)) {
			throw new AppError(400, "INVALID_STATUS_TRANSITION", `A job cannot move from "${fromStatus}" to "${toStatus}".`);
		}
		if (toStatus === "completed" && !note) {
			throw new AppError(400, "COMPLETION_NOTES_REQUIRED", "Completion notes are required to mark a job as completed.");
		}
		const update = { status: toStatus };
		if (toStatus === "completed") update.completionNotes = note;
		const updated = await jobRepository.update(id, update);
		await jobStatusHistoryRepository.create({ jobId: id, fromStatus, toStatus, changedBy: user._id, note: note || "" });
		return jobRepository.findById(updated._id);
	},
	async updateDetails(id, input) {
		ensureObjectId(id);
		const job = await jobRepository.findById(id);
		if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job does not exist.");
		if (!["requested", "scheduled"].includes(job.status)) {
			throw new AppError(400, "JOB_LOCKED", "This job can no longer be edited because work has started.");
		}
		if (job.technicianId && (input.scheduledStartAt || input.scheduledEndAt)) {
			const startAt = input.scheduledStartAt ?? job.scheduledStartAt;
			const endAt = input.scheduledEndAt ?? job.scheduledEndAt;
			await ensureAssignable(job.technicianId._id, startAt, endAt, id);
		}
		const updated = await jobRepository.update(id, input);
		return jobRepository.findById(updated._id);
	},
};
