import "dotenv/config";

import { completeCoverage } from "./coverage-pass.service.js";
import { findCoverageGaps } from "./coverage.service.js";
import type { Kit } from "../schemas/kit.schema.js";

async function main() {
  const requirements: Kit["role"]["requirements"] = [
    {
      id: "r1",
      text: "React",
      kind: "technical",
      priority: "must",
    },
    {
      id: "r2",
      text: "TypeScript",
      kind: "technical",
      priority: "must",
    },
    {
      id: "r3",
      text: "REST APIs",
      kind: "technical",
      priority: "must",
    },
  ];

  const companyBrief: Kit["company_brief"] = {
    summary: "A business solutions company.",
    what_they_do: "Provides business services.",
    sources: [],
  };

  // Deliberately leave r3 uncovered.
  const existingQuestions: Kit["questions"] = [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "React question",
      answer_outline: "React answer",
      difficulty: 2,
    },
    {
      id: "q2",
      requirement_ids: ["r2"],
      category: "technical",
      prompt: "TypeScript question",
      answer_outline: "TypeScript answer",
      difficulty: 2,
    },
  ];

  console.log(
    "Before:",
    findCoverageGaps(requirements, existingQuestions)
  );

  const completed = await completeCoverage(
    requirements,
    existingQuestions,
    companyBrief
  );

  console.log(
    "After:",
    findCoverageGaps(requirements, completed)
  );

  console.log(
    "\nQuestions:",
    JSON.stringify(completed, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});