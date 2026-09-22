import "dotenv/config";

import { researchCompany } from "./company-research.service.js";
import { generateCompanyBrief } from "./company-brief.service.js";

async function main() {
  const companyUrl = "https://linkupgroup.co.in/";

  const research = await researchCompany(companyUrl);

  const brief = await generateCompanyBrief(
    "Linkup Group Pvt Ltd",
    research.combinedText
  );

  console.log(JSON.stringify(brief, null, 2));
  console.log("\nSources:");
  console.log(research.pagesUsed);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});