import { ServiceType } from "./service-type.model.js";

export const serviceTypeRepository = {
	findAll: () => ServiceType.find().sort({ name: 1 }).lean(),
	findActive: () => ServiceType.find({ active: true }).sort({ name: 1 }).lean(),
	findById: (id) => ServiceType.findById(id).lean(),
	findByName: (name) => ServiceType.findOne({ name }).lean(),
	create: (input) => ServiceType.create(input),
	update: (id, input) => ServiceType.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean(),
	remove: (id) => ServiceType.findByIdAndDelete(id).lean(),
};
