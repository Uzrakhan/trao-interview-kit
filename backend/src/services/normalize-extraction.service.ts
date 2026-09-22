import type { JobExtraction } from "../schemas/extraction.schema.js";
import type { Kit } from "../schemas/kit.schema.js";

export function normalizeExtraction(
  extraction: JobExtraction
): Kit["role"] {
  return {
    title: extraction.title,
    seniority: extraction.seniority,
    responsibilities: extraction.responsibilities,
    requirements: extraction.requirements.map((requirement, index) => ({
      id: `r${index + 1}`,
      text: requirement.text,
      kind: requirement.kind,
      priority: requirement.priority,
    })),
  };
}