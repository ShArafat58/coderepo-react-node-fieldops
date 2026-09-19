import { Router } from "express";
import { createCustomer, createProperty, deleteCustomer, getCustomer, listCustomers, updateCustomer } from "./customer.controller.js";
import { requireRole } from "../../shared/middleware/auth.js";

export const customerRouter = Router();
customerRouter.get("/", listCustomers);
customerRouter.get("/:customerId", getCustomer);
customerRouter.post("/", requireRole("admin"), createCustomer);
customerRouter.patch("/:customerId", requireRole("admin"), updateCustomer);
customerRouter.delete("/:customerId", requireRole("admin"), deleteCustomer);
customerRouter.post("/:customerId/properties", requireRole("admin"), createProperty);
