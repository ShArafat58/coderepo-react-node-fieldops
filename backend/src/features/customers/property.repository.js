import { Property } from "./property.model.js";

export const propertyRepository = {
	findByCustomerId: (customerId) => Property.find({ customerId }).sort({ createdAt: 1 }).lean(),
	findById: (id) => Property.findById(id).lean(),
	create: (input) => Property.create(input),
	update: (id, input) => Property.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean(),
	remove: (id) => Property.findByIdAndDelete(id).lean(),
	removeByCustomerId: (customerId) => Property.deleteMany({ customerId }),
};
