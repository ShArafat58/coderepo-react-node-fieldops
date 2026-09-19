import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
	{
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
		propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
		serviceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceType", required: true },
		technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },
		status: {
			type: String,
			enum: ["requested", "scheduled", "en_route", "in_progress", "completed", "invoiced", "cancelled"],
			default: "requested",
		},
		scheduledStartAt: { type: Date, default: null },
		scheduledEndAt: { type: Date, default: null },
		price: { type: Number, min: 0, default: null },
		completionNotes: { type: String, maxlength: 2000, default: "" },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	},
	{ timestamps: true, versionKey: false },
);

jobSchema.index({ technicianId: 1, scheduledStartAt: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ customerId: 1 });

export const Job = mongoose.model("Job", jobSchema);
