import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { customerRepository } from "../customers/customer.repository.js";
import { propertyRepository } from "../customers/property.repository.js";
import { serviceTypeRepository } from "../service-catalog/service-type.repository.js";
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

export const jobService = {
	async list(user) {
		if (user.role === "technician") {
			const { technicianRepository } = await import("../technicians/technician.repository.js");
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
		const updated = await jobRepository.update(id, input);
		return jobRepository.findById(updated._id);
	},
};
