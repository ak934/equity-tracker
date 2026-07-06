import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getPrice } from "../lib/prices";

getPrice("AAPL")
  .then((result) => console.log("SUCCESS:", result))
  .catch((err) => console.error("FAILED:", err));
