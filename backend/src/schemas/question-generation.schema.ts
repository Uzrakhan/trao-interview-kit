import { z } from "zod";

export const GeneratedQuestionSchema = z.object({
  requirement_ids: z.array(z.string()).min(1),
  category: z.enum([
    "technical",
    "behavioural",
    "system-design",
    "company-fit",
  ]),
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
});

export const GeneratedQuestionsSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;