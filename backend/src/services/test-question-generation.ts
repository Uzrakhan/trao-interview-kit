import "dotenv/config";

import { generateQuestions } from "./question-generation.service.js";
import { normalizeQuestions } from "./normalize-questions.service.js";
import type { Kit } from "../schemas/kit.schema.js";

async function main() {
  const requirements: Kit["role"]["requirements"] = [
    {
      id: "r1",
      text: "2+ years of experience with React.",
      kind: "technical",
      priority: "must",
    },
    {
      id: "r2",
      text: "Strong knowledge of TypeScript.",
      kind: "technical",
      priority: "must",
    },
    {
      id: "r3",
      text: "Experience with REST APIs.",
      kind: "technical",
      priority: "must",
    },
    {
      id: "r4",
      text: "Good communication skills.",
      kind: "behavioural",
      priority: "must",
    },
    {
      id: "r5",
      text: "Experience with Next.js.",
      kind: "technical",
      priority: "nice",
    },
  ];

  const companyBrief: Kit["company_brief"] = {
    summary:
      "Linkup Group Pvt Ltd is an integrated business solutions group.",
    what_they_do:
      "The group provides marketing, web, legal, and financial services.",
    sources: ["https://linkupgroup.co.in/"],
  };

  const generated = await generateQuestions(
    requirements,
    companyBrief,
    10
  );

  const questions = normalizeQuestions(generated);

  console.log(JSON.stringify(questions, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});