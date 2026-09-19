import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { serviceTypeRepository } from "./service-type.repository.js";

function ensureObjectId(id) {
	if (!mongoose.isValidObjectId(id)) throw new AppError(404, "SERVICE_TYPE_NOT_FOUND", "The requested service type does not exist.");
}

async function ensureUniqueName(name, excludeId) {
	const existing = await serviceTypeRepository.findByName(name);
	if (existing && String(existing._id) !== String(excludeId)) {
		throw new AppError(409, "DUPLICATE_SERVICE_TYPE", "A service type with this name already exists.");
	}
}

export const serviceTypeService = {
	async list() {
		return serviceTypeRepository.findAll();
	},
	async listActive() {
		return serviceTypeRepository.findActive();
	},
	async create(input) {
		await ensureUniqueName(input.name);
		return serviceTypeRepository.create(input);
	},
	async update(id, input) {
		ensureObjectId(id);
		if (input.name) await ensureUniqueName(input.name, id);
		const updated = await serviceTypeRepository.update(id, input);
		if (!updated) throw new AppError(404, "SERVICE_TYPE_NOT_FOUND", "The requested service type does not exist.");
		return updated;
	},
	async remove(id) {
		ensureObjectId(id);
		const removed = await serviceTypeRepository.remove(id);
		if (!removed) throw new AppError(404, "SERVICE_TYPE_NOT_FOUND", "The requested service type does not exist.");
	},
};
