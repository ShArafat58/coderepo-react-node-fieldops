import { Router } from "express";
import { createTechnician, listTechnicians, updateTechnician } from "./technician.controller.js";
import { requireRole } from "../../shared/middleware/auth.js";

export const technicianRouter = Router();
technicianRouter.get("/", listTechnicians);
technicianRouter.post("/", requireRole("admin"), createTechnician);
technicianRouter.patch("/:technicianId", requireRole("admin"), updateTechnician);
