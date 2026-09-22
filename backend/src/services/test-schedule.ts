import { allocateSchedule } from "./schedule.service.js";
import type { Kit } from "../schemas/kit.schema.js";

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

const questions: Kit["questions"] = [
  {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "React question",
    answer_outline: "Answer",
    difficulty: 3,
  },
  {
    id: "q2",
    requirement_ids: ["r2"],
    category: "technical",
    prompt: "TypeScript question",
    answer_outline: "Answer",
    difficulty: 2,
  },
  {
    id: "q3",
    requirement_ids: ["r3"],
    category: "technical",
    prompt: "REST question",
    answer_outline: "Answer",
    difficulty: 1,
  },
];

const schedule = allocateSchedule(
  questions,
  requirements,
  3
);

console.log(JSON.stringify(schedule, null, 2));