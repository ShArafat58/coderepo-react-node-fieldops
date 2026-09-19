import mongoose from "mongoose";

const jobStatusHistorySchema = new mongoose.Schema(
	{
		jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
		fromStatus: { type: String, default: null },
		toStatus: { type: String, required: true },
		changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		note: { type: String, maxlength: 500, default: "" },
	},
	{ timestamps: true, versionKey: false },
);

jobStatusHistorySchema.index({ jobId: 1, createdAt: 1 });

export const JobStatusHistory = mongoose.model("JobStatusHistory", jobStatusHistorySchema);
