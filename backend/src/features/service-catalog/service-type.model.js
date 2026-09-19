import mongoose from "mongoose";

const serviceTypeSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, unique: true, maxlength: 120 },
		description: { type: String, maxlength: 500, default: "" },
		estimatedDurationMinutes: { type: Number, required: true, min: 5, max: 1440 },
		basePrice: { type: Number, required: true, min: 0 },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true, versionKey: false },
);

export const ServiceType = mongoose.model("ServiceType", serviceTypeSchema);
