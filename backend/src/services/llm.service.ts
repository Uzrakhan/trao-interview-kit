import "dotenv/config";

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.LLM_API_KEY;

if (!apiKey) {
  throw new Error("LLM_API_KEY is not configured");
}

const ai = new GoogleGenAI({ apiKey });

const model = process.env.LLM_MODEL || "gemini-2.5-flash";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateText(
  prompt: string,
  maxAttempts = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = response.text;

      if (!text) {
        throw new Error("LLM returned an empty response");
      }

      return text;
    } catch (error: any) {
      const status = error?.status;

      const retryable =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504;

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 2000;

      console.warn(
        `LLM request failed (${status}). Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw new Error("LLM request failed after retries");
}