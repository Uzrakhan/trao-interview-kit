import { generateQuestions } from "./question-generation.service.js";
import type { Kit } from "../schemas/kit.schema.js";
import { findCoverageGaps } from "./coverage.service.js";

export async function completeCoverage(
  requirements: Kit["role"]["requirements"],
  existingQuestions: Kit["questions"],
  companyBrief: Kit["company_brief"]
): Promise<Kit["questions"]> {
  let questions = [...existingQuestions];

  const gaps = findCoverageGaps(requirements, questions);

  if (gaps.length === 0) {
    return questions;
  }

  const missingRequirements = requirements.filter((requirement) =>
    gaps.includes(requirement.id)
  );

  const generated = await generateQuestions(
    missingRequirements,
    companyBrief,
    missingRequirements.length * 2
  );

  const newQuestions = generated.map((question, index) => ({
    id: `q${questions.length + index + 1}`,
    requirement_ids: question.requirement_ids,
    category: question.category,
    prompt: question.prompt,
    answer_outline: question.answer_outline,
    difficulty: question.difficulty,
  }));

  questions = [...questions, ...newQuestions];

  return questions;
}