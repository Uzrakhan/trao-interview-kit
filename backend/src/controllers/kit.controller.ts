import type { Response } from "express";
import mongoose from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.js";
import { KitModel } from "../models/kit.model.js";
import { KitSchema } from "../schemas/kit.schema.js";
import { generateKit, regenerateKitQuestions } from "../services/kit-generation.service.js";

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
      editedQuestionIds: [],
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

export async function updateKitController(
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

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid kit ID",
        },
      });
    }

    const existingKit = await KitModel.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!existingKit) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Interview kit not found",
        },
      });
    }

    if (!req.body?.kit) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Kit data is required",
        },
      });
    }

    const parsed = KitSchema.safeParse(req.body.kit);

    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_KIT",
          message: "The submitted kit is invalid",
          details: parsed.error.flatten(),
        },
      });
    }

    existingKit.kit = parsed.data;

    if (Array.isArray(req.body.editedQuestionIds)) {
      existingKit.editedQuestionIds = req.body.editedQuestionIds.filter(
        (id: unknown): id is string => typeof id === "string"
      );
    }

    await existingKit.save();

    return res.json({
      id: existingKit._id,
      status: existingKit.status,
      kit: existingKit.kit,
      editedQuestionIds: existingKit.editedQuestionIds,
    });
  } catch (error) {
    console.error("Failed to update kit:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update interview kit",
      },
    });
  }
}


export async function listKitsController(
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

    const kits = await KitModel.find(
      { userId: req.userId },
      {
        input: 1,
        status: 1,
        stage: 1,
        error: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ kits });
  } catch (error) {
    console.error("Failed to list kits:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load interview kits",
      },
    });
  }
}


export async function regenerateQuestionsController(
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

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid kit ID",
        },
      });
    }

    const existingKit = await KitModel.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!existingKit || !existingKit.kit) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Interview kit not found",
        },
      });
    }

    const updatedKit = await regenerateKitQuestions(
      existingKit.kit,
      existingKit.editedQuestionIds ?? [],
      existingKit.input.days
    );

    existingKit.kit = updatedKit;

    await existingKit.save();

    return res.json({
      id: existingKit._id,
      status: existingKit.status,
      kit: existingKit.kit,
      editedQuestionIds: existingKit.editedQuestionIds ?? [],
    });
  } catch (error) {
    console.error("Failed to regenerate questions:", error);

    return res.status(500).json({
      error: {
        code: "REGENERATION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to regenerate questions",
      },
    });
  }
}