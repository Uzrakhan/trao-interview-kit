import "dotenv/config";

import { researchCompany } from "./company-research.service.js";

async function main() {
  const result = await researchCompany("https://linkupgroup.co.in/");

  console.log("PAGES USED:");
  console.log(result.pagesUsed);

  console.log("\nCOMBINED TEXT:");
  console.log(result.combinedText.slice(0, 2000));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});