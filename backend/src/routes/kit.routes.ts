import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";

import {
  generateKitController,
  getKitController,
  listKitsController,
  updateKitController,
  regenerateQuestionsController
} from "../controllers/kit.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/generate", generateKitController);

router.get("/", listKitsController);

router.post("/:id/regenerate",regenerateQuestionsController);

router.get("/:id", getKitController);

router.patch("/:id", updateKitController);

export default router;