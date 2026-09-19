import { Router } from "express";
import { createSavedView, deleteSavedView, listSavedViews } from "./saved-view.controller.js";

export const savedViewRouter = Router();
savedViewRouter.get("/", listSavedViews);
savedViewRouter.post("/", createSavedView);
savedViewRouter.delete("/:savedViewId", deleteSavedView);
