import type { Response } from "express";
import mongoose from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.js";
import { KitModel } from "../models/kit.model.js";
import { generateKit } from "../services/kit-generation.service.js";

export async function generateKitController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required",
        },
      });
    }

    const { jd, companyUrl, days, location = "" } = req.body;

    if (
      typeof jd !== "string" ||
      !jd.trim() ||
      typeof companyUrl !== "string" ||
      !companyUrl.trim() ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 60
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Invalid JD, company URL, or days",
        },
      });
    }

    const record = await KitModel.create({
      userId: new mongoose.Types.ObjectId(req.userId),
      status: "generating",
      stage: "Starting generation",
      input: {
        jd,
        companyUrl,
        days,
        location,
      },
    });

    // Start generation without making the HTTP request wait.
    void runGeneration(record._id.toString());

    return res.status(202).json({
      id: record._id,
      status: "generating",
    });
  } catch (error) {
    console.error("Generate kit error:", error);

    return res.status(500).json({
      error: {
        code: "GENERATION_START_FAILED",
        message: "Could not start kit generation",
      },
    });
  }
}

async function runGeneration(recordId: string) {
  try {
    const record = await KitModel.findById(recordId);

    if (!record) {
      return;
    }

    await KitModel.findByIdAndUpdate(recordId, {
      stage: "Extracting requirements",
    });

    const { jd, companyUrl, days, location } = record.input;

    // The current generateKit pipeline does all stages internally.
    // We update the visible stage before/after the main pipeline.
    await KitModel.findByIdAndUpdate(recordId, {
      stage: "Researching company and generating interview kit",
    });

    const kit = await generateKit({
      jd,
      companyUrl,
      days,
      location,
    });

    await KitModel.findByIdAndUpdate(recordId, {
      status: "completed",
      stage: "Completed",
      kit,
      error: undefined,
    });

    console.log(`Kit ${recordId} generated successfully`);
  } catch (error) {
    console.error(`Kit ${recordId} generation failed:`, error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown generation error";

    await KitModel.findByIdAndUpdate(recordId, {
      status: "failed",
      stage: "Generation failed",
      error: message,
    });
  }
}

export async function getKitController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid kit ID",
        },
      });
    }

    const kit = await KitModel.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!kit) {
      return res.status(404).json({
        error: {
          code: "KIT_NOT_FOUND",
          message: "Kit not found",
        },
      });
    }

    return res.json(kit);
  } catch (error) {
    console.error("Get kit error:", error);

    return res.status(500).json({
      error: {
        code: "KIT_FETCH_FAILED",
        message: "Could not fetch kit",
      },
    });
  }
}