import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { customerRepository } from "./customer.repository.js";
import { propertyRepository } from "./property.repository.js";

function ensureObjectId(id) {
	if (!mongoose.isValidObjectId(id)) throw new AppError(404, "CUSTOMER_NOT_FOUND", "The requested customer does not exist.");
}

export const customerService = {
	async list() {
		return customerRepository.findAll();
	},
	async getById(id) {
		ensureObjectId(id);
		const customer = await customerRepository.findById(id);
		if (!customer) throw new AppError(404, "CUSTOMER_NOT_FOUND", "The requested customer does not exist.");
		const properties = await propertyRepository.findByCustomerId(id);
		return { ...customer, properties };
	},
	async create(input) {
		return customerRepository.create(input);
	},
	async update(id, input) {
		ensureObjectId(id);
		const updated = await customerRepository.update(id, input);
		if (!updated) throw new AppError(404, "CUSTOMER_NOT_FOUND", "The requested customer does not exist.");
		return updated;
	},
	async remove(id) {
		ensureObjectId(id);
		const customer = await customerRepository.remove(id);
		if (!customer) throw new AppError(404, "CUSTOMER_NOT_FOUND", "The requested customer does not exist.");
		await propertyRepository.removeByCustomerId(id);
	},
};
