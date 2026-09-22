import "dotenv/config";

import { generateText } from "./llm.service.js";

async function main() {
  const response = await generateText(
    "Reply with exactly: Gemini connection works"
  );

  console.log(response);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});