import { Router } from "express";
import { login, logout, session } from "./auth.controller.js";
import { requireAuth } from "../../shared/middleware/auth.js";
import { rateLimit } from "../../shared/middleware/rate-limit.js";

export const authRouter = Router();
authRouter.post("/login", rateLimit({ windowMs: 60000, max: 10 }), login);
authRouter.get("/session", requireAuth, session);
authRouter.post("/logout", requireAuth, logout);
