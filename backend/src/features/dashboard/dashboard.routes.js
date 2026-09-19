import { Router } from "express";
import { getSummary } from "./dashboard.controller.js";
import { requireRole } from "../../shared/middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.get("/summary", requireRole("admin"), getSummary);
