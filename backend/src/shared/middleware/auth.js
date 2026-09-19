import { authService } from "../../features/auth/auth.service.js";
import { AppError } from "../errors/app-error.js";

export async function requireAuth(request, response, next) {
	try {
		const header = request.headers.authorization || "";
		const token = header.startsWith("Bearer ") ? header.slice(7) : "";
		if (!token) throw new AppError(401, "MISSING_TOKEN", "Sign in to continue.");
		request.user = await authService.authenticate(token);
		next();
	} catch (error) {
		next(error);
	}
}

export function requireRole(...roles) {
	return (request, response, next) => {
		if (!roles.includes(request.user?.role)) return next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action."));
		next();
	};
}
