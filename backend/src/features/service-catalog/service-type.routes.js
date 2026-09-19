import { Router } from "express";
import { createServiceType, deleteServiceType, listServiceTypes, updateServiceType } from "./service-type.controller.js";
import { requireRole } from "../../shared/middleware/auth.js";

export const serviceTypeRouter = Router();
serviceTypeRouter.get("/", listServiceTypes);
serviceTypeRouter.post("/", requireRole("admin"), createServiceType);
serviceTypeRouter.patch("/:serviceTypeId", requireRole("admin"), updateServiceType);
serviceTypeRouter.delete("/:serviceTypeId", requireRole("admin"), deleteServiceType);
