import { JobStatusHistory } from "./job-status-history.model.js";

export const jobStatusHistoryRepository = {
	findByJobId: (jobId) => JobStatusHistory.find({ jobId }).populate("changedBy", "name").sort({ createdAt: 1 }).lean(),
	create: (input) => JobStatusHistory.create(input),
};
