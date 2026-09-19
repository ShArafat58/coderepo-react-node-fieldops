const attempts = new Map();

export function rateLimit({ windowMs, max }) {
	return (request, response, next) => {
		const key = request.ip;
		const now = Date.now();
		const record = attempts.get(key) || { count: 0, resetAt: now + windowMs };
		if (now > record.resetAt) {
			record.count = 0;
			record.resetAt = now + windowMs;
		}
		record.count += 1;
		attempts.set(key, record);
		if (record.count > max) {
			response.status(429).json({ error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again later." } });
			return;
		}
		next();
	};
}
