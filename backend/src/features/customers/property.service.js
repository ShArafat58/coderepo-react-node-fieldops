import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { customerRepository } from "./customer.repository.js";
import { propertyRepository } from "./property.repository.js";

function ensureObjectId(id) {
	if (!mongoose.isValidObjectId(id)) throw new AppError(404, "PROPERTY_NOT_FOUND", "The requested property does not exist.");
}

async function ensureCustomer(customerId) {
	if (!mongoose.isValidObjectId(customerId) || !(await customerRepository.findById(customerId))) {
		throw new AppError(422, "INVALID_CUSTOMER", "The selected customer does not exist.");
	}
}

export const propertyService = {
	async create(customerId, input) {
		await ensureCustomer(customerId);
		return propertyRepository.create({ ...input, customerId });
	},
	async update(id, input) {
		ensureObjectId(id);
		const updated = await propertyRepository.update(id, input);
		if (!updated) throw new AppError(404, "PROPERTY_NOT_FOUND", "The requested property does not exist.");
		return updated;
	},
	async remove(id) {
		ensureObjectId(id);
		const property = await propertyRepository.remove(id);
		if (!property) throw new AppError(404, "PROPERTY_NOT_FOUND", "The requested property does not exist.");
	},
};
