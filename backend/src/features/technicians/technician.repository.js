import { Technician } from "./technician.model.js";

export const technicianRepository = {
	findAll: () => Technician.find().populate("userId", "name email active").sort({ createdAt: 1 }).lean(),
	findById: (id) => Technician.findById(id).populate("userId", "name email active").lean(),
	findByUserId: (userId) => Technician.findOne({ userId }).lean(),
	create: (input) => Technician.create(input),
	update: (id, input) => Technician.findByIdAndUpdate(id, input, { new: true, runValidators: true }).populate("userId", "name email active").lean(),
};
