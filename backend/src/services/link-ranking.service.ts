export function rankCompanyLinks(
  baseUrl: string,
  links: string[]
): string[] {
  const base = new URL(baseUrl);

  const scored = links
    .map((link) => {
      try {
        const url = new URL(link);

        // Only follow links on the same domain.
        if (url.hostname !== base.hostname) {
          return null;
        }

        const text = `${url.pathname} ${url.search}`.toLowerCase();

        let score = 0;

        const keywords = [
          "career",
          "careers",
          "job",
          "jobs",
          "hiring",
          "work-with-us",
          "about",
          "company",
          "team",
          "culture",
          "interview",
        ];

        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            score += 10;
          }
        }

        // Prefer shallower URLs.
        score -= url.pathname.split("/").filter(Boolean).length;

        return {
          url: url.href,
          score,
        };
      } catch {
        return null;
      }
    })
    .filter(
      (item): item is { url: string; score: number } =>
        item !== null
    );

  return [...new Map(
    scored
      .sort((a, b) => b.score - a.score)
      .map((item) => [item.url, item])
  ).values()]
    .slice(0, 5)
    .map((item) => item.url);
}