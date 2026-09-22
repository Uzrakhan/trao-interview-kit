import { generateText } from "./llm.service.js";
import {
  GeneratedQuestionsSchema,
  type GeneratedQuestion,
} from "../schemas/question-generation.schema.js";
import type { Kit } from "../schemas/kit.schema.js";

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function generateQuestions(
  requirements: Kit["role"]["requirements"],
  companyBrief: Kit["company_brief"],
  count = 12
): Promise<GeneratedQuestion[]> {
  const requirementText = requirements
    .map(
      (r) =>
        `${r.id} | ${r.priority} | ${r.kind} | ${r.text}`
    )
    .join("\n");

  const prompt = `
You are generating interview questions for a personalized interview preparation kit.

Generate up to ${count} useful interview questions.

IMPORTANT:
- Use ONLY the supplied requirements and company information.
- Every question MUST reference at least one requirement ID.
- Do not invent requirements.
- Do not reference requirement IDs that were not supplied.
- Prioritize "must" requirements over "nice" requirements.
- Cover different relevant interview categories.
- Technical requirements should generally produce technical questions.
- Behavioural requirements should generally produce behavioural questions.
- Domain requirements can produce domain or company-fit questions.
- Questions should be specific enough to practice.
- Answer outlines should contain concise points the candidate should cover.
- Difficulty must be 1, 2, or 3.
- Avoid duplicate questions.

Return ONLY valid JSON:

{
  "questions": [
    {
      "requirement_ids": ["r1"],
      "category": "technical",
      "prompt": "Question here",
      "answer_outline": "Key points...",
      "difficulty": 2
    }
  ]
}

Allowed categories:
- technical
- behavioural
- system-design
- company-fit

REQUIREMENTS:
${requirementText}

COMPANY BRIEF:
Summary: ${companyBrief.summary}

What they do: ${companyBrief.what_they_do}
`;

  const raw = await generateText(prompt);

  let parsed: unknown;

  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error(
      "LLM returned invalid JSON for question generation"
    );
  }

  const result = GeneratedQuestionsSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `Invalid generated questions: ${result.error.message}`
    );
  }

  const validRequirementIds = new Set(
    requirements.map((requirement) => requirement.id)
  );

  const validQuestions = result.data.questions.filter((question) =>
    question.requirement_ids.every((id) =>
      validRequirementIds.has(id)
    )
  );

  return validQuestions;
}