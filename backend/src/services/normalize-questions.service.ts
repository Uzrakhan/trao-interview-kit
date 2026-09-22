import type { Kit } from "../schemas/kit.schema.js";
import type { GeneratedQuestion } from "../schemas/question-generation.schema.js";

export function normalizeQuestions(
  questions: GeneratedQuestion[]
): Kit["questions"] {
  return questions.map((question, index) => ({
    id: `q${index + 1}`,
    requirement_ids: question.requirement_ids,
    category: question.category,
    prompt: question.prompt,
    answer_outline: question.answer_outline,
    difficulty: question.difficulty,
  }));
}