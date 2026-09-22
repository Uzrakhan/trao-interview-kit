import { extractJobRequirements } from "./extraction.service.js";
import { normalizeExtraction } from "./normalize-extraction.service.js";
import { researchCompany } from "./company-research.service.js";
import { generateCompanyBrief } from "./company-brief.service.js";
import { generateQuestions } from "./question-generation.service.js";
import { normalizeQuestions } from "./normalize-questions.service.js";
import { completeCoverage } from "./coverage-pass.service.js";
import { findCoverageGaps } from "./coverage.service.js";
import { allocateSchedule } from "./schedule.service.js";
import { generateText } from "./llm.service.js";

import { KitSchema, type Kit } from "../schemas/kit.schema.js";

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

async function generateFlashcards(
  requirements: Kit["role"]["requirements"],
  questions: Kit["questions"]
): Promise<Kit["flashcards"]> {
  const relevantQuestions = questions.slice(0, 20);

  const prompt = `
Create concise interview flashcards from the supplied requirements
and interview questions.

Rules:
- Use ONLY the supplied information.
- Every flashcard must reference at least one valid requirement ID.
- Keep answers concise and useful for interview revision.
- Do not invent requirements.
- Create between 1 and 2 flashcards per major requirement where useful.
- Return ONLY valid JSON.

Format:

{
  "flashcards": [
    {
      "front": "Question or concept",
      "back": "Concise answer",
      "requirement_ids": ["r1"]
    }
  ]
}

REQUIREMENTS:
${requirements
  .map(
    (r) =>
      `${r.id} | ${r.priority} | ${r.kind} | ${r.text}`
  )
  .join("\n")}

QUESTIONS:
${relevantQuestions
  .map(
    (q) =>
      `${q.id} | ${q.requirement_ids.join(",")} | ${q.prompt}`
  )
  .join("\n")}
`;

  const raw = await generateText(prompt);

  let parsed: unknown;

  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error("LLM returned invalid JSON for flashcards");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("flashcards" in parsed) ||
    !Array.isArray(parsed.flashcards)
  ) {
    throw new Error("Invalid flashcard response");
  }

  const validRequirementIds = new Set(
    requirements.map((r) => r.id)
  );

  const flashcards = parsed.flashcards
    .filter(
      (card): card is {
        front: string;
        back: string;
        requirement_ids: string[];
      } =>
        typeof card === "object" &&
        card !== null &&
        "front" in card &&
        "back" in card &&
        "requirement_ids" in card &&
        typeof card.front === "string" &&
        typeof card.back === "string" &&
        Array.isArray(card.requirement_ids)
    )
    .filter((card) =>
      card.requirement_ids.every((id) =>
        validRequirementIds.has(id)
      )
    )
    .map((card, index) => ({
      id: `f${index + 1}`,
      front: card.front,
      back: card.back,
      requirement_ids: card.requirement_ids,
    }));

  return flashcards;
}

interface GenerateKitInput {
  jd: string;
  companyUrl: string;
  days: number;
  location?: string;
}

export async function generateKit(
  input: GenerateKitInput
): Promise<Kit> {
  const {
    jd,
    companyUrl,
    days,
    location = "",
  } = input;

  if (!jd.trim()) {
    throw new Error("Job description is required");
  }

  if (!Number.isInteger(days) || days < 1 || days > 60) {
    throw new Error("Days must be an integer between 1 and 60");
  }

  // --------------------------------------------------
  // 1. Extract requirements from the JD
  // --------------------------------------------------

  const extraction = await extractJobRequirements(jd);

  const role = normalizeExtraction(extraction);

  // --------------------------------------------------
  // 2. Research company
  // --------------------------------------------------

  const research = await researchCompany(companyUrl);

  // --------------------------------------------------
  // 3. Generate company brief
  // --------------------------------------------------

  const companyName =
    research.pages[0]?.title || companyUrl;

  const companyBriefBase = await generateCompanyBrief(
    companyName,
    research.combinedText
  );

  const companyBrief: Kit["company_brief"] = {
    ...companyBriefBase,
    sources: research.pagesUsed,
  };

  // --------------------------------------------------
  // 4. Generate initial questions
  // --------------------------------------------------

  const generatedQuestions = await generateQuestions(
    role.requirements,
    companyBrief,
    Math.max(10, role.requirements.length * 2)
  );

  let questions = normalizeQuestions(
    generatedQuestions
  );

  // --------------------------------------------------
  // 5. Deterministic coverage check
  // --------------------------------------------------

  let uncovered = findCoverageGaps(
    role.requirements,
    questions
  );

  // --------------------------------------------------
  // 6. Second pass for missing requirements
  // --------------------------------------------------

  if (uncovered.length > 0) {
    questions = await completeCoverage(
      role.requirements,
      questions,
      companyBrief
    );
  }

  // --------------------------------------------------
  // 7. Deterministic coverage check AGAIN
  // --------------------------------------------------

  uncovered = findCoverageGaps(
    role.requirements,
    questions
  );

  if (uncovered.length > 0) {
    throw new Error(
      `Unable to cover required requirements: ${uncovered.join(", ")}`
    );
  }

  // --------------------------------------------------
  // 8. Generate flashcards
  // --------------------------------------------------

  const flashcards = await generateFlashcards(
    role.requirements,
    questions
  );

  // --------------------------------------------------
  // 9. Deterministic schedule
  // --------------------------------------------------

  const schedule = allocateSchedule(
    questions,
    role.requirements,
    days
  );

  // --------------------------------------------------
  // 10. Build final kit
  // --------------------------------------------------

  const kit: Kit = {
    source: {
      company: companyName,
      company_url: companyUrl,
      role: role.title,
      location,
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: research.pagesUsed,
    },

    company_brief: companyBrief,

    role,

    questions,

    flashcards,

    schedule,

    coverage: {
      uncovered_requirement_ids: uncovered,
      passes: 2,
    },
  };

  // --------------------------------------------------
  // 11. Final validation
  // --------------------------------------------------

  const validation = KitSchema.safeParse(kit);

  if (!validation.success) {
    throw new Error(
      `Generated kit failed validation: ${validation.error.message}`
    );
  }

  return validation.data;
}

export async function regenerateKitQuestions(
  existingKit: Kit,
  editedQuestionIds: string[],
  days: number
): Promise<Kit> {
  // --------------------------------------------------
  // 1. Keep questions the user manually edited
  // --------------------------------------------------

  const editedIds = new Set(editedQuestionIds);

  const preservedQuestions = existingKit.questions.filter((question) =>
    editedIds.has(question.id)
  );

  // --------------------------------------------------
  // 2. Generate fresh questions
  // --------------------------------------------------

  const generatedQuestions = await generateQuestions(
    existingKit.role.requirements,
    existingKit.company_brief,
    Math.max(10, existingKit.role.requirements.length * 2)
  );

  let freshQuestions = normalizeQuestions(generatedQuestions);

  // --------------------------------------------------
  // 3. Remove generated questions whose IDs collide
  //    with preserved questions
  // --------------------------------------------------

  const preservedIds = new Set(
    preservedQuestions.map((question) => question.id)
  );

  freshQuestions = freshQuestions.filter(
    (question) => !preservedIds.has(question.id)
  );

  // --------------------------------------------------
  // 4. Give fresh questions stable unique IDs
  // --------------------------------------------------

  const usedIds = new Set(
    preservedQuestions.map((question) => question.id)
  );

  let nextQuestionNumber = 1;

  freshQuestions = freshQuestions.map((question) => {
    while (usedIds.has(`q${nextQuestionNumber}`)) {
      nextQuestionNumber++;
    }

    const id = `q${nextQuestionNumber}`;
    nextQuestionNumber++;

    usedIds.add(id);

    return {
      ...question,
      id,
    };
  });

  // --------------------------------------------------
  // 5. Combine preserved + regenerated questions
  // --------------------------------------------------

  let questions = [
    ...preservedQuestions,
    ...freshQuestions,
  ];

  // --------------------------------------------------
  // 6. Check coverage
  // --------------------------------------------------

  let uncovered = findCoverageGaps(
    existingKit.role.requirements,
    questions
  );

  // --------------------------------------------------
  // 7. Second pass for missing requirements
  // --------------------------------------------------

  if (uncovered.length > 0) {
    questions = await completeCoverage(
      existingKit.role.requirements,
      questions,
      existingKit.company_brief
    );
  }

  // --------------------------------------------------
  // 8. Check coverage again
  // --------------------------------------------------

  uncovered = findCoverageGaps(
    existingKit.role.requirements,
    questions
  );

  if (uncovered.length > 0) {
    throw new Error(
      `Unable to cover required requirements: ${uncovered.join(", ")}`
    );
  }

  // --------------------------------------------------
  // 9. Regenerate flashcards from the new questions
  // --------------------------------------------------

  const flashcards = await generateFlashcards(
    existingKit.role.requirements,
    questions
  );

  // --------------------------------------------------
  // 10. Recalculate schedule
  // --------------------------------------------------

  const schedule = allocateSchedule(
    questions,
    existingKit.role.requirements,
    days
  );

  // --------------------------------------------------
  // 11. Build updated kit
  // --------------------------------------------------

  const updatedKit: Kit = {
    ...existingKit,

    questions,

    flashcards,

    schedule,

    coverage: {
      uncovered_requirement_ids: uncovered,
      passes: 2,
    },
  };

  // --------------------------------------------------
  // 12. Final validation
  // --------------------------------------------------

  const validation = KitSchema.safeParse(updatedKit);

  if (!validation.success) {
    throw new Error(
      `Regenerated kit failed validation: ${validation.error.message}`
    );
  }

  return validation.data;
}