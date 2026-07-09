import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { generateAnalysis } from "../lib/analysis";

generateAnalysis("AAPL", 310.66)
  .then((result) => {
    console.log("qualityScore:", result.qualityScore);
    console.log("valuationScore:", result.valuationScore);
    console.log("action:", result.action);
    console.log("\n--- fullText ---\n");
    console.log(result.fullText);
  })
  .catch((err) => console.error("FAILED:", err));