import "dotenv/config";

import { generateKit } from "./kit-generation.service.js";

async function main() {
  const jd = `
Frontend Developer

We are looking for a Frontend Developer to build responsive
web applications and work closely with designers and backend engineers.

Requirements:
- 2+ years of experience with React.
- Strong knowledge of TypeScript.
- Experience with REST APIs.
- Good communication skills.
- Experience with Next.js is a plus.
`;

  const kit = await generateKit({
    jd,
    companyUrl: "https://linkupgroup.co.in/",
    days: 3,
    location: "Noida, India",
  });

  console.log(
    JSON.stringify(
      {
        source: kit.source,
        company_brief: kit.company_brief,
        role: kit.role,
        question_count: kit.questions.length,
        flashcard_count: kit.flashcards.length,
        schedule: kit.schedule,
        coverage: kit.coverage,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});