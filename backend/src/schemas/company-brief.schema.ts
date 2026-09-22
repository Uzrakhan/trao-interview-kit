import { z } from "zod";

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
});

export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;