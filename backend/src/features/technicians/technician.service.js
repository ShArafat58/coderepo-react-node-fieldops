import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { User } from "../auth/user.model.js";
import { technicianRepository } from "./technician.repository.js";

function ensureObjectId(id) {
	if (!mongoose.isValidObjectId(id)) throw new AppError(404, "TECHNICIAN_NOT_FOUND", "The requested technician does not exist.");
}

export const technicianService = {
	async list() {
		return technicianRepository.findAll();
	},
	async create(input) {
		const existingUser = await User.findOne({ email: input.email.toLowerCase() });
		if (existingUser) throw new AppError(409, "DUPLICATE_EMAIL", "A user with this email already exists.");
		const passwordHash = await bcrypt.hash(input.password, 10);
		let user;
		try {
			user = await User.create({ name: input.name, email: input.email.toLowerCase(), passwordHash, role: "technician" });
			const technician = await technicianRepository.create({
				userId: user._id,
				skills: input.skills,
				workingHours: input.workingHours,
			});
			return technicianRepository.findById(technician._id);
		} catch (error) {
			if (user) await User.findByIdAndDelete(user._id);
			throw error;
		}
	},
	async update(id, input) {
		ensureObjectId(id);
		const { active, ...technicianFields } = input;
		const technician = await technicianRepository.findById(id);
		if (!technician) throw new AppError(404, "TECHNICIAN_NOT_FOUND", "The requested technician does not exist.");
		if (typeof active === "boolean") await User.findByIdAndUpdate(technician.userId._id, { active });
		if (Object.keys(technicianFields).length) return technicianRepository.update(id, technicianFields);
		return technicianRepository.findById(id);
	},
};
