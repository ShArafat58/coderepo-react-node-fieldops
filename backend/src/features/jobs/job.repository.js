import { Job } from "./job.model.js";

const ACTIVE_STATUSES = ["requested", "scheduled", "en_route", "in_progress", "completed"];

function buildFilter(filters, scopeFilter) {
	const query = { ...scopeFilter };
	if (filters.status) query.status = filters.status;
	if (filters.technicianId) query.technicianId = filters.technicianId;
	if (filters.customerId) query.customerId = filters.customerId;
	if (filters.dateFrom || filters.dateTo) {
		query.scheduledStartAt = {};
		if (filters.dateFrom) query.scheduledStartAt.$gte = new Date(filters.dateFrom);
		if (filters.dateTo) query.scheduledStartAt.$lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
	}
	return query;
}

export const jobRepository = {
	findFiltered: (filters, scopeFilter, cursor, limit) => {
		const query = buildFilter(filters, scopeFilter);
		if (cursor) query._id = { $lt: cursor };
		return Job.find(query)
			.populate("customerId", "name phone")
			.populate("propertyId", "address propertyType")
			.populate("serviceTypeId", "name estimatedDurationMinutes basePrice")
			.populate({ path: "technicianId", populate: { path: "userId", select: "name email" } })
			.sort({ _id: -1 })
			.limit(limit + 1)
			.lean();
	},
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
