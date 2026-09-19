import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { authRouter } from "./features/auth/auth.routes.js";
import { customerRouter } from "./features/customers/customer.routes.js";
import { propertyRouter } from "./features/customers/property.routes.js";
import { jobRouter } from "./features/jobs/job.routes.js";
import { savedViewRouter } from "./features/jobs/saved-view.routes.js";
import { serviceTypeRouter } from "./features/service-catalog/service-type.routes.js";
import { technicianRouter } from "./features/technicians/technician.routes.js";
import { requireAuth } from "./shared/middleware/auth.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler.js";

export function createApp() {
	const app = express();
	app.disable("x-powered-by");
	app.use(cors());
	app.use(express.json({ limit: "100kb" }));
	app.get("/api/v1/health", (request, response) => {
		const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
		response.status(database === "connected" ? 200 : 503).json({ data: { status: database === "connected" ? "ok" : "degraded", database } });
	});
	app.use("/api/v1/auth", authRouter);
	app.use("/api/v1/customers", requireAuth, customerRouter);
	app.use("/api/v1/properties", requireAuth, propertyRouter);
	app.use("/api/v1/service-types", requireAuth, serviceTypeRouter);
	app.use("/api/v1/technicians", requireAuth, technicianRouter);
	app.use("/api/v1/jobs", requireAuth, jobRouter);
	app.use("/api/v1/saved-views", requireAuth, savedViewRouter);
	app.use(notFoundHandler);
	app.use(errorHandler);
	return app;
}