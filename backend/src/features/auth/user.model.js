import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120 },
		email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
		passwordHash: { type: String, required: true, select: false },
		role: { type: String, enum: ["admin", "technician"], required: true },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true, versionKey: false },
);

export const User = mongoose.model("User", userSchema);
