import { findCoverageGaps } from "./coverage.service.js";
import type { Kit } from "../schemas/kit.schema.js";

const requirements: Kit["role"]["requirements"] = [
  { id: "r1", text: "React", kind: "technical", priority: "must" },
  { id: "r2", text: "TypeScript", kind: "technical", priority: "must" },
  { id: "r3", text: "REST APIs", kind: "technical", priority: "must" },
  { id: "r4", text: "Communication", kind: "behavioural", priority: "must" }
];

const questions: Kit["questions"] = [
  {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "",
    answer_outline: "",
    difficulty: 2
  },
  {
    id: "q2",
    requirement_ids: ["r2"],
    category: "technical",
    prompt: "",
    answer_outline: "",
    difficulty: 2
  },
  {
    id: "q3",
    requirement_ids: ["r4"],
    category: "behavioural",
    prompt: "",
    answer_outline: "",
    difficulty: 1
  }
];

console.log(findCoverageGaps(requirements, questions));