import { Router } from "express";
import { createJob, getJob, listJobs, updateJobDetails, updateJobStatus } from "./job.controller.js";
import { requireRole } from "../../shared/middleware/auth.js";

export const jobRouter = Router();
jobRouter.get("/", listJobs);
jobRouter.get("/:jobId", getJob);
jobRouter.post("/", requireRole("admin"), createJob);
jobRouter.patch("/:jobId/status", updateJobStatus);
jobRouter.patch("/:jobId", requireRole("admin"), updateJobDetails);
