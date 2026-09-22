import "dotenv/config";

import { fetchPage } from "./research.service.js";
import { rankCompanyLinks } from "./link-ranking.service.js";

async function main() {
  const result = await fetchPage("https://example.com");

  const rankedLinks = rankCompanyLinks(
    "https://example.com",
    result.links
  );

  console.log("TITLE:");
  console.log(result.title);

  console.log("\nRANKED LINKS:");
  console.log(rankedLinks);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});