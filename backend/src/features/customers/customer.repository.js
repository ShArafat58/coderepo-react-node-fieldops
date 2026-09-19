import { Customer } from "./customer.model.js";

export const customerRepository = {
	findAll: () => Customer.find().sort({ name: 1 }).lean(),
	findById: (id) => Customer.findById(id).lean(),
	create: (input) => Customer.create(input),
	update: (id, input) => Customer.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean(),
	remove: (id) => Customer.findByIdAndDelete(id).lean(),
};
