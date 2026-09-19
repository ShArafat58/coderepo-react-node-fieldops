import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120 },
		phone: { type: String, required: true, trim: true, maxlength: 30 },
		email: { type: String, trim: true, lowercase: true, maxlength: 254 },
		notes: { type: String, maxlength: 1000, default: "" },
	},
	{ timestamps: true, versionKey: false },
);

export const Customer = mongoose.model("Customer", customerSchema);
