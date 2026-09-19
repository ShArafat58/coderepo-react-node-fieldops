import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { AppError } from "../../shared/errors/app-error.js";
import { getConfig } from "../../shared/config/index.js";
import { authRepository } from "./auth.repository.js";

const publicUser = (user) => ({ _id: String(user._id), name: user.name, email: user.email, role: user.role });
const sign = (user) => jwt.sign({ sub: String(user._id), role: user.role }, getConfig().jwtSecret, { expiresIn: getConfig().jwtExpiresIn, issuer: "fieldops-api", audience: "fieldops-app" });

export const authService = {
	async login(email, password) {
		const user = await authRepository.findActiveByEmailWithPassword(email.toLowerCase());
		const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
		if (!valid) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
		return { user: publicUser(user), token: sign(user) };
	},
	async authenticate(token) {
		let payload;
		try {
			payload = jwt.verify(token, getConfig().jwtSecret, { issuer: "fieldops-api", audience: "fieldops-app" });
		} catch {
			throw new AppError(401, "INVALID_TOKEN", "Your session is invalid or has expired.");
		}
		if (!mongoose.isValidObjectId(payload.sub)) throw new AppError(401, "INVALID_TOKEN", "Your session is invalid or has expired.");
		const user = await authRepository.findActiveById(payload.sub);
		if (!user) throw new AppError(401, "ACCOUNT_UNAVAILABLE", "This account is no longer available.");
		return user;
	},
	session(user) {
		return { user: publicUser(user) };
	},
};
