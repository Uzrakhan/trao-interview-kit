import { fetchPage, type ResearchPage } from "./research.service.js";
import { rankCompanyLinks } from "./link-ranking.service.js";

export interface CompanyResearch {
  pages: ResearchPage[];
  pagesUsed: string[];
  combinedText: string;
}

export async function researchCompany(
  companyUrl: string
): Promise<CompanyResearch> {
  const firstPage = await fetchPage(companyUrl);

  const rankedLinks = rankCompanyLinks(
    companyUrl,
    firstPage.links
  );

  const pages: ResearchPage[] = [firstPage];

  // Keep this deliberately small.
  // We don't want to crawl an entire company website.
  for (const link of rankedLinks.slice(0, 3)) {
    if (link === companyUrl) continue;

    try {
      const page = await fetchPage(link);

      pages.push(page);
    } catch (error) {
      console.warn(`Skipping ${link}:`, error);
    }
  }

  const combinedText = pages
    .map(
      (page) =>
        `SOURCE: ${page.url}\nTITLE: ${page.title}\n${page.text}`
    )
    .join("\n\n---\n\n");

  return {
    pages,
    pagesUsed: pages.map((page) => page.url),
    combinedText: combinedText.slice(0, 100_000),
  };
}