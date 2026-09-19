import mongoose from "mongoose";

const savedViewSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		name: { type: String, required: true, trim: true, maxlength: 80 },
		filters: {
			status: { type: String, default: "" },
			technicianId: { type: String, default: "" },
			customerId: { type: String, default: "" },
			dateFrom: { type: String, default: "" },
			dateTo: { type: String, default: "" },
		},
	},
	{ timestamps: true, versionKey: false },
);

savedViewSchema.index({ userId: 1 });

export const SavedView = mongoose.model("SavedView", savedViewSchema);
