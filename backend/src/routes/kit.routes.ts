import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";

import {
  generateKitController,
  getKitController,
} from "../controllers/kit.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/generate", generateKitController);

router.get("/:id", getKitController);

export default router;