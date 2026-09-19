import cors from "cors";
import express from "express";
import mongoose from "mongoose";
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
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}