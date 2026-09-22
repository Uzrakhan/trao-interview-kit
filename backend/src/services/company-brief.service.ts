import { generateText } from "./llm.service.js";
import {
  CompanyBriefSchema,
  type CompanyBrief,
} from "../schemas/company-brief.schema.js"

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function generateCompanyBrief(
  companyName: string,
  researchText: string
): Promise<CompanyBrief> {
  const prompt = `
You are preparing a factual company brief for an interview preparation tool.

Company: ${companyName}

Use ONLY information contained in the research below.

Do not:
- invent products or services
- invent company history
- infer things that the sources do not establish
- make claims about the company that are not supported by the research

Return ONLY valid JSON:

{
  "summary": "A concise factual summary of the company.",
  "what_they_do": "A concise explanation of what the company does."
}

RESEARCH:
${researchText.slice(0, 30000)}
`;

  const raw = await generateText(prompt);

  let parsed: unknown;

  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error("LLM returned invalid JSON for company brief");
  }

  const result = CompanyBriefSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `Invalid company brief: ${result.error.message}`
    );
  }

  return result.data;
}