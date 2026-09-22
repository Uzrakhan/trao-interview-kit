import type { Kit } from "../schemas/kit.schema.js";

export function allocateSchedule(
  questions: Kit["questions"],
  requirements: Kit["role"]["requirements"],
  daysAvailable: number
): Kit["schedule"] {
  if (!Number.isInteger(daysAvailable) || daysAvailable < 1) {
    throw new Error("daysAvailable must be at least 1");
  }

  const priority = new Map(
    requirements.map((requirement) => [
      requirement.id,
      requirement.priority === "must" ? 2 : 1,
    ])
  );

  const sortedQuestions = [...questions].sort((a, b) => {
    const priorityA = Math.max(
      ...a.requirement_ids.map((id) => priority.get(id) ?? 0)
    );

    const priorityB = Math.max(
      ...b.requirement_ids.map((id) => priority.get(id) ?? 0)
    );

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    return b.difficulty - a.difficulty;
  });

  const days = Array.from(
    { length: daysAvailable },
    (_, index) => ({
      day: index + 1,
      focus: "",
      question_ids: [] as string[],
      minutes: 0,
    })
  );

  for (let i = 0; i < sortedQuestions.length; i++) {
    const question = sortedQuestions[i];

    // Put questions into days sequentially.
    const dayIndex = i % daysAvailable;

    days[dayIndex].question_ids.push(question.id);

    // Deterministic time allocation.
    days[dayIndex].minutes += question.difficulty * 15;
  }

  for (const day of days) {
    const dayQuestions = day.question_ids
      .map((id) => questions.find((question) => question.id === id))
      .filter(
        (question): question is Kit["questions"][number] =>
          Boolean(question)
      );

    const categories = [
      ...new Set(dayQuestions.map((question) => question.category)),
    ];

    day.focus =
      categories.length > 0
        ? `Focus on ${categories.join(", ")}`
        : "Review core interview preparation";
  }

  return {
    days_available: daysAvailable,
    days,
  };
}