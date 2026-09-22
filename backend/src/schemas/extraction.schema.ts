import { z } from "zod";

export const ExtractionRequirementSchema = z.object({
  text: z.string().min(1),
  kind: z.enum(["technical", "behavioural", "domain"]),
  priority: z.enum(["must", "nice"]),
});

export const JobExtractionSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(ExtractionRequirementSchema),
});

export type JobExtraction = z.infer<typeof JobExtractionSchema>;