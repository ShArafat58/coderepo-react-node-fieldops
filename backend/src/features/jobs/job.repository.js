import { Job } from "./job.model.js";

const ACTIVE_STATUSES = ["requested", "scheduled", "en_route", "in_progress", "completed"];

export const jobRepository = {
	findAll: () => Job.find()
		.populate("customerId", "name phone")
		.populate("propertyId", "address propertyType")
		.populate("serviceTypeId", "name estimatedDurationMinutes basePrice")
		.populate({ path: "technicianId", populate: { path: "userId", select: "name email" } })
		.sort({ createdAt: -1 })
		.lean(),
	findByTechnicianId: (technicianId) => Job.find({ technicianId })
		.populate("customerId", "name phone")
		.populate("propertyId", "address propertyType")
		.populate("serviceTypeId", "name estimatedDurationMinutes basePrice")
		.populate({ path: "technicianId", populate: { path: "userId", select: "name email" } })
		.sort({ scheduledStartAt: 1 })
		.lean(),
	findById: (id) => Job.findById(id)
		.populate("customerId", "name phone")
		.populate("propertyId", "address propertyType")
		.populate("serviceTypeId", "name estimatedDurationMinutes basePrice")
		.populate({ path: "technicianId", populate: { path: "userId", select: "name email" } })
		.lean(),
	findOverlapping: (technicianId, startAt, endAt, excludeJobId) => Job.find({
		technicianId,
		status: { $in: ACTIVE_STATUSES },
		scheduledStartAt: { $lt: endAt },
		scheduledEndAt: { $gt: startAt },
		...(excludeJobId ? { _id: { $ne: excludeJobId } } : {}),
	}).lean(),
	create: (input) => Job.create(input),
	update: (id, input) => Job.findByIdAndUpdate(id, input, { new: true, runValidators: true }),
};
