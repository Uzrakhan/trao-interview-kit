import "dotenv/config";
import fs from "node:fs/promises";
import { generateKit } from "./src/services/kit-generation.service.js";

type EvaluationCase = {
  id: string;
  jd: string;
  company_url: string;
  days: number;
  location?: string;
};

type EvaluationOutput = {
  version: "1.0";
  generated_at: string;
  kits: Array<{
    id: string;
    status: "ok" | "failed";
    kit?: unknown;
    error?: string;
  }>;
};

async function main() {
  const args = process.argv.slice(2);

    let inputPath: string | undefined;
    let outputPath: string | undefined;

    const inputIndex = args.indexOf("--input");
    const outputIndex = args.indexOf("--output");

    if (inputIndex !== -1) {
     inputPath = args[inputIndex + 1];
    }

    if (outputIndex !== -1) {
     outputPath = args[outputIndex + 1];
    }

    // npm may strip the flags when forwarding arguments.
    // Support: cases.json kits.json
    if (!inputPath && !outputPath && args.length >= 2) {
        inputPath = args[0];
        outputPath = args[1];
    }

    if (!inputPath) {
     throw new Error("Missing input file");
    }

    if (!outputPath) {
     throw new Error("Missing output file");
    }

  const inputText = await fs.readFile(inputPath, "utf8");
  const cases = JSON.parse(inputText) as EvaluationCase[];

  if (!Array.isArray(cases)) {
    throw new Error("Input must be a JSON array");
  }

  const results: EvaluationOutput["kits"] = [];

  for (const testCase of cases) {
    console.log(`\n=== Evaluating ${testCase.id} ===`);

    try {
      if (
        typeof testCase.id !== "string" ||
        typeof testCase.jd !== "string" ||
        typeof testCase.company_url !== "string" ||
        !Number.isInteger(testCase.days) ||
        testCase.days < 1
      ) {
        throw new Error("Invalid evaluation case");
      }

      const kit = await generateKit({
        jd: testCase.jd,
        companyUrl: testCase.company_url,
        days: testCase.days,
        location: testCase.location ?? "",
      });

      results.push({
        id: testCase.id,
        status: "ok",
        kit,
      });

      console.log(`✓ ${testCase.id} completed`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown generation error";

      console.error(`✗ ${testCase.id} failed: ${message}`);

      results.push({
        id: testCase.id,
        status: "failed",
        error: message,
      });
    }
  }

  const output: EvaluationOutput = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    kits: results,
  };

  await fs.writeFile(
    outputPath,
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log(`\nEvaluation complete.`);
  console.log(`Output written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Evaluation failed"
  );
  process.exit(1);
});