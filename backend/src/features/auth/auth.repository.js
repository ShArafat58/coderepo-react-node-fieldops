import { User } from "./user.model.js";

export const authRepository = {
	findActiveByEmailWithPassword: (email) => User.findOne({ email, active: true }).select("+passwordHash"),
	findActiveById: (id) => User.findOne({ _id: id, active: true }),
};
