import fs from "fs";
import path from "path";

export const K6_PROMPT_REGISTRY = Object.freeze({
  javascript: {
    extension: ".js",
    prompt: fs.readFileSync(
      path.resolve("D:\\K6_convertion\\src\\ai\\prompts\\k6-load-javascript-system-prompt.js"),
      "utf-8"
    )
  },
  typescript: {
    extension: ".ts",
    prompt: fs.readFileSync(
      path.resolve("D:\\K6_convertion\\src\\ai\\prompts\\k6-load-typescript-system-prompt.js"),
      "utf-8"
    )
  }
});
