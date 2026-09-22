import type { Kit } from "../schemas/kit.schema.js";

export function findCoverageGaps(
  requirements: Kit["role"]["requirements"],
  questions: Kit["questions"]
): string[] {
  const covered = new Set<string>();

  for (const question of questions) {
    for (const id of question.requirement_ids) {
      covered.add(id);
    }
  }

  return requirements
    .filter((r) => r.priority === "must")
    .filter((r) => !covered.has(r.id))
    .map((r) => r.id);
}