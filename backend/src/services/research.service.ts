import * as cheerio from "cheerio";
import { canFetchUrl } from "./robots.service.js";

export interface ResearchPage {
  url: string;
  title: string;
  text: string;
  links: string[];
}

export async function fetchPage(url: string): Promise<ResearchPage> {

  const allowed = await canFetchUrl(url);

  if (!allowed) {
    throw new Error(`Blocked by robots.txt: ${url}`)
  }
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TraoInterviewKit/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: HTTP ${response.status}`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error(`Expected HTML but received ${contentType}`);
  }

  const html = await response.text();

  if (html.length > 2_000_000) {
    throw new Error("Page is too large to process");
  }

  const $ = cheerio.load(html);

  $("script, style, noscript, svg").remove();

  const title = $("title").text().trim();

  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  const links = $("a[href]")
    .map((_, element) => $(element).attr("href"))
    .get()
    .map((href) => {
      try {
        return new URL(href, url).href;
      } catch {
        return null;
      }
    })
    .filter((link): link is string => Boolean(link));

  return {
    url,
    title,
    text,
    links: [...new Set(links)],
  };
}