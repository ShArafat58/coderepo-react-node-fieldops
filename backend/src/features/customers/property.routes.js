import { Router } from "express";
import { deleteProperty, updateProperty } from "./property.controller.js";
import { requireRole } from "../../shared/middleware/auth.js";

export const propertyRouter = Router();
propertyRouter.patch("/:propertyId", requireRole("admin"), updateProperty);
propertyRouter.delete("/:propertyId", requireRole("admin"), deleteProperty);
