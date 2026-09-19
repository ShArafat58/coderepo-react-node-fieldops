import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { savedViewRepository } from "./saved-view.repository.js";

export const savedViewService = {
	async list(userId) {
		return savedViewRepository.findByUserId(userId);
	},
	async create(userId, input) {
		return savedViewRepository.create({ userId, ...input });
	},
	async remove(id, userId) {
		if (!mongoose.isValidObjectId(id)) throw new AppError(404, "SAVED_VIEW_NOT_FOUND", "The requested saved view does not exist.");
		const removed = await savedViewRepository.remove(id, userId);
		if (!removed) throw new AppError(404, "SAVED_VIEW_NOT_FOUND", "The requested saved view does not exist.");
	},
};
