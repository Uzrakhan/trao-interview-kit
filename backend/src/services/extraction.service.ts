import { generateText } from "./llm.service.js";
import {
  JobExtractionSchema,
  type JobExtraction,
} from "../schemas/extraction.schema.js";

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function extractJobRequirements(
  jd: string
): Promise<JobExtraction> {
    if (jd.trim().length < 20) {
        return {
            title: "",
            seniority: "",
            responsibilities: [],
            requirements: [],
        };
    }
  const prompt = `
You are extracting structured information from a job description.

IMPORTANT RULES:
- Use ONLY information explicitly present in the job description.
- Do NOT invent technologies, responsibilities, qualifications, years of experience, or other requirements.
- If something is not stated, leave it out.
- A thin job description should produce a thin result.
- "must" means the JD clearly presents it as required, mandatory, essential, or equivalent.
- "nice" means preferred, bonus, desirable, or equivalent.
- Preserve the meaning of the original wording.
- Each requirement must be a concrete interview-relevant requirement.
- Do not duplicate requirements.

Return ONLY valid JSON. No markdown and no explanation.

Required JSON structure:

{
  "title": "",
  "seniority": "",
  "responsibilities": [],
  "requirements": [
    {
      "text": "",
      "kind": "technical",
      "priority": "must"
    }
  ]
}

Allowed requirement kinds:
- technical
- behavioural
- domain

JOB DESCRIPTION:
${jd}
`;

  const raw = await generateText(prompt);

  let parsed: unknown;

  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error("LLM returned invalid JSON for job extraction");
  }

  const result = JobExtractionSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `Invalid job extraction: ${result.error.message}`
    );
  }

  return result.data;
}