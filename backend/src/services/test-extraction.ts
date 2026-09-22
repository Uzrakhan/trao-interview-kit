import "dotenv/config";

import { extractJobRequirements } from "./extraction.service.js";
import { normalizeExtraction } from "./normalize-extraction.service.js";

async function main() {
  const jd = `
We are looking for a Frontend Developer.

Responsibilities:
- Build responsive web applications.
- Work closely with designers and backend engineers.

Requirements:
- 2+ years of experience with React.
- Strong knowledge of TypeScript.
- Experience with REST APIs.
- Good communication skills.
- Experience with Next.js is a plus.
`;

  const extraction = await extractJobRequirements(jd);
  const role = normalizeExtraction(extraction);

  console.log(JSON.stringify(role, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});