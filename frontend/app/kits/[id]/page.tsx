"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type KitRecord = {
  _id: string;
  status: "generating" | "completed" | "failed";
  stage: string;
  error?: string;
  editedQuestionIds?: string[];
  input: {
    jd: string;
    companyUrl: string;
    days: number;
    location: string;
  };
  kit?: {
    source: {
      company: string;
      role: string;
      location: string;
    };
    company_brief: {
      summary: string;
      what_they_do: string;
    };
    role: {
      title: string;
      requirements: {
        id: string;
        text: string;
        priority: "must" | "nice";
      }[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        prompt: string;
        answer_outline: string;
        category: string;
        difficulty: number;
    }[];
    flashcards: {
      id: string;
      front: string;
      back: string;
    }[];
    schedule: {
      days_available: number;
      days: {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
      }[];
    };
    coverage: {
      uncovered_requirement_ids: string[];
      passes: number;
    };
  };
};

export default function KitPage() {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [record, setRecord] = useState<KitRecord | null>(null);
  const [error, setError] = useState("");

  async function saveQuestion(questionId: string) {
    if (!kit) return;

    setSaving(true);
    setError("");

    try {
      const updatedQuestions = kit.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              prompt: editedPrompt,
              answer_outline: editedAnswer,
            }
          : question
      );

      const updatedKit = {
        ...kit,
        questions: updatedQuestions,
      };

      // Remember that this specific question was manually edited.
      const editedQuestionIds = Array.from(
        new Set([
          ...(record?.editedQuestionIds ?? []),
          questionId,
        ])
      );

      const updated = await apiFetch<KitRecord>(`/api/kits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          kit: updatedKit,
          editedQuestionIds,
        }),
      });

      setRecord(updated);
      setEditingQuestionId(null);
      setEditedPrompt("");
      setEditedAnswer("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save question"
      );
    } finally {
      setSaving(false);
    }
  }

  function moveQuestion(questionId: string, direction: "up" | "down") {
    if (!kit) return;

    const currentIndex = kit.questions.findIndex(
      (question) => question.id === questionId
    );

    if (currentIndex === -1) return;

    const newIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (newIndex < 0 || newIndex >= kit.questions.length) {
      return;
    }

    const questions = [...kit.questions];

    const [movedQuestion] = questions.splice(currentIndex, 1);

    questions.splice(newIndex, 0, movedQuestion);

    setRecord((currentRecord) => {
      if (!currentRecord) return currentRecord;

      return {
        ...currentRecord,
        kit: {
          ...kit,
          questions,
        },
      };
    });
  }

  function addQuestion() {
    if (!kit) return;

    const nextNumber =
      Math.max(
        0,
        ...kit.questions.map((q) => {
          const match = q.id.match(/\d+/);
          return match ? Number(match[0]) : 0;
        })
      ) + 1;

    const newQuestion = {
      id: `q${nextNumber}`,
      requirement_ids: [],
      category: "technical",
      prompt: "New interview question",
      answer_outline: "Add an answer outline.",
      difficulty: 1,
    };

    setRecord((currentRecord) => {
      if (!currentRecord?.kit) return currentRecord;

      return {
        ...currentRecord,
        kit: {
          ...currentRecord.kit,
          questions: [...currentRecord.kit.questions, newQuestion],
        },
      };
    });
  }


  function deleteQuestion(questionId: string) {
    if (!kit) return;

    const questions = kit.questions.filter(
      (question) => question.id !== questionId
    );

    setRecord((currentRecord) => {
      if (!currentRecord?.kit) return currentRecord;

      return {
        ...currentRecord,
        kit: {
          ...currentRecord.kit,
          questions,
        },
      };
    });
  }



  async function saveQuestionOrder() {
    if (!kit) return;

    setSaving(true);
    setError("");

    try {
      const updated = await apiFetch<KitRecord>(`/api/kits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          kit,
        }),
      });

      setRecord(updated);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save question order"
      );
    } finally {
      setSaving(false);
    }
  }



  async function regenerateQuestions() {
    if (!record) return;

    setIsRegenerating(true);

    try {
      const updated = await apiFetch<KitRecord>(
        `/api/kits/${id}/regenerate`,
        {
          method: "POST",
        }
      );

      setRecord(updated);
    } catch (error) {
      console.error(error);
      alert("Failed to regenerate questions");
    } finally {
      setIsRegenerating(false);
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadKit() {
      try {
        const data = await apiFetch<KitRecord>(`/api/kits/${id}`);

        setRecord(data);

        if (data.status === "generating") {
          interval = setTimeout(loadKit, 3000);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load interview kit"
        );
      }
    }

    loadKit();

    return () => {
      if (interval) {
        clearTimeout(interval);
      }
    };
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-400">Loading interview kit...</p>
        </div>
      </main>
    );
  }

  if (record.status === "generating") {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-white" />

            <p className="text-sm text-slate-400">
              Generating your interview kit
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              {record.stage}
            </h1>

            <p className="mt-4 text-sm text-slate-500">
              This can take a little while while we research the company
              and generate your preparation material.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (record.status === "failed") {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-2xl pt-20">
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-8">
            <h1 className="text-2xl font-bold">Generation failed</h1>

            <p className="mt-3 text-red-300">
              {record.error || "The interview kit could not be generated."}
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 rounded-lg bg-white px-4 py-2 font-medium text-slate-950"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const kit = record.kit;

  if (!kit) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <p>Kit data is missing.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-8 text-sm text-slate-400 hover:text-white"
        >
          ← Back to dashboard
        </button>

        <header className="mb-10">
          <p className="text-sm text-slate-400">
            {kit.source.company}
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {kit.source.role}
          </h1>

          <p className="mt-2 text-slate-400">
            {kit.source.location}
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Company Brief
          </h2>

          <p className="mt-4 text-slate-300">
            {kit.company_brief.summary}
          </p>

          <p className="mt-4 text-slate-400">
            {kit.company_brief.what_they_do}
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Requirements
          </h2>

          <div className="mt-4 space-y-3">
            {kit.role.requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-lg bg-slate-950 p-4"
              >
                <div className="flex gap-2">
                  <span className="text-xs text-slate-500">
                    {requirement.id}
                  </span>

                  <span
                    className={`text-xs ${
                      requirement.priority === "must"
                        ? "text-red-300"
                        : "text-blue-300"
                    }`}
                  >
                    {requirement.priority}
                  </span>
                </div>

                <p className="mt-2 text-slate-200">
                  {requirement.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Interview Questions
            </h2>

           <div className="flex gap-2">
              <button
                onClick={regenerateQuestions}
                disabled={isRegenerating}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate Questions"}
              </button>

              <button
                onClick={addQuestion}
                className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
              >
                + Add Question
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={saveQuestionOrder}
            disabled={saving}
            className="mb-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Order"}
          </button>

          <div className="space-y-4">
           {kit.questions.map((question) => {
                const isEditing = editingQuestionId === question.id;

                return (
                    <div
                    key={question.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                    >
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{question.category}</span>
                        <span>Difficulty {question.difficulty}/3</span>
                        {record.editedQuestionIds?.includes(question.id) && (
                          <span className="text-green-400">
                            Edited
                          </span>
                        )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={kit.questions.findIndex(
                              (q) => q.id === question.id
                            ) === 0}
                            onClick={() => moveQuestion(question.id, "up")}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-sm disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={
                              kit.questions.findIndex(
                                (q) => q.id === question.id
                              ) === kit.questions.length - 1
                            }
                            onClick={() => moveQuestion(question.id, "down")}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-sm disabled:opacity-30"
                          >
                            ↓
                          </button>

                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(question.id);
                                setEditedPrompt(question.prompt);
                                setEditedAnswer(question.answer_outline);
                              }}
                              className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteQuestion(question.id)}
                            className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm text-slate-400">
                            Question
                            </label>

                            <textarea
                            value={editedPrompt}
                            onChange={(event) =>
                                setEditedPrompt(event.target.value)
                            }
                            rows={4}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-400">
                            Answer outline
                            </label>

                            <textarea
                            value={editedAnswer}
                            onChange={(event) =>
                                setEditedAnswer(event.target.value)
                            }
                            rows={5}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-white"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveQuestion(question.id)}
                            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
                            >
                            {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                            type="button"
                            disabled={saving}
                            onClick={() => setEditingQuestionId(null)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                            >
                            Cancel
                            </button>
                        </div>
                        </div>
                    ) : (
                        <>
                        <h3 className="font-medium text-slate-100">
                            {question.prompt}
                        </h3>

                        <div className="mt-4 rounded-lg bg-slate-950 p-4">
                            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                            Answer outline
                            </p>

                            <p className="text-sm leading-6 text-slate-300">
                            {question.answer_outline}
                            </p>
                        </div>
                        </>
                    )}
                    </div>
                );
            })}
          </div>
        </section>


        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Practice</h2>
            <p className="mt-1 text-sm text-slate-400">
              Review flashcards and track your confidence.
            </p>
          </div>

          {kit.flashcards.length === 0 ? (
  <p className="text-sm text-slate-400">
    No flashcards available.
  </p>
            ) : (
              (() => {
                const card = kit.flashcards[practiceIndex];

                return (
                  <div>
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-6">
                      <p className="mb-4 text-xs uppercase tracking-wide text-slate-500">
                        Card {practiceIndex + 1} of {kit.flashcards.length}
                      </p>

                      <h3 className="text-lg font-medium text-white">
                        {card.front}
                      </h3>

                      {showAnswer && (
                        <div className="mt-6 rounded-lg bg-slate-800 p-4">
                          <p className="text-sm leading-6 text-slate-200">
                            {card.back}
                          </p>
                        </div>
                      )}

                      {!showAnswer && (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="mt-6 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
                        >
                          Reveal Answer
                        </button>
                      )}
                    </div>

                    {showAnswer && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm text-slate-400">
                          How confident are you?
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {(["low", "medium", "high"] as const).map((level) => (
                            <button
                              key={level}
                              onClick={() => setConfidence(level)}
                              className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                                confidence === level
                                  ? "border-pink-500 bg-pink-500/10 text-pink-400"
                                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>

                        <button
                          disabled={!confidence}
                          onClick={() => {
                            setPracticeIndex(
                              (practiceIndex + 1) % kit.flashcards.length
                            );
                            setShowAnswer(false);
                            setConfidence(null);
                          }}
                          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next Card
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Preparation Schedule
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {kit.schedule.days.map((day) => (
              <div
                key={day.day}
                className="rounded-xl bg-slate-950 p-4"
              >
                <p className="text-sm text-slate-500">
                  Day {day.day}
                </p>

                <h3 className="mt-2 font-medium">
                  {day.focus}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {day.question_ids.length} questions ·{" "}
                  {day.minutes} minutes
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-green-900 bg-green-950/20 p-5">
          <p className="text-sm text-green-300">
            Coverage check passed
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {kit.coverage.passes} coverage passes ·{" "}
            {kit.coverage.uncovered_requirement_ids.length === 0
              ? "All must-have requirements covered"
              : "Some requirements remain uncovered"}
          </p>
        </section>
      </div>
    </main>
  );
}