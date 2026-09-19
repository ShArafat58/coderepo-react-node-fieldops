import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
	{
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
		address: { type: String, required: true, trim: true, maxlength: 250 },
		propertyType: { type: String, enum: ["residential", "commercial"], required: true },
		notes: { type: String, maxlength: 1000, default: "" },
	},
	{ timestamps: true, versionKey: false },
);

propertySchema.index({ customerId: 1 });

export const Property = mongoose.model("Property", propertySchema);
