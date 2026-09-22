import robotsParser from "robots-parser";

export async function canFetchUrl(
  url: string,
  userAgent = "TraoInterviewKit/1.0"
): Promise<boolean> {
  const target = new URL(url);

  const robotsUrl = `${target.origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, {
      headers: {
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(5_000),
    });

    // If robots.txt doesn't exist, we can proceed.
    if (!response.ok) {
      return true;
    }

    const robotsText = await response.text();

    const robots = robotsParser(robotsUrl, robotsText);

    return robots.isAllowed(url, userAgent) !== false;
  } catch {
    // Don't make a research failure just because robots.txt
    // couldn't be retrieved.
    return true;
  }
}