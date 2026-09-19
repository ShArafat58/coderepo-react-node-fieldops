import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		skills: [{ type: String, trim: true, maxlength: 100 }],
		workingHours: {
			daysOfWeek: [{ type: Number, min: 0, max: 6 }],
			startTime: { type: String, default: "09:00" },
			endTime: { type: String, default: "17:00" },
		},
		active: { type: Boolean, default: true },
	},
	{ timestamps: true, versionKey: false },
);

export const Technician = mongoose.model("Technician", technicianSchema);
