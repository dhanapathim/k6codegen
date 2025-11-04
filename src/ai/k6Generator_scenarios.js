import { chat } from "./genaiClient.js";
import { k6Template } from "./k6Template_scenarios.js";
import { PromptTemplate } from "@langchain/core/prompts";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // ✅ Load environment variables

// 🔒 Define mandatory fields for each executor type
const MANDATORY_FIELDS_MAP = {
  "shared-iterations": ["exec", "vus", "iterations"],
  "per-vu-iterations": ["exec", "vus", "iterations"],
  "constant-vus": ["exec", "vus", "duration"],
  "ramping-vus": ["exec", "stages"],
  "constant-arrival-rate": [
    "exec",
    "rate",
    "timeUnit",
    "duration",
    "preAllocatedVUs",
    "maxVUs",
  ],
  "ramping-arrival-rate": [
    "exec",
    "startRate",
    "timeUnit",
    "stages",
    "preAllocatedVUs",
    "maxVUs",
  ],
  "externally-controlled": ["exec", "maxVUs"],
};

export async function K6Scriptgenerate(data) {
  const { config, scenarios } = data;

  // ✅ Step 1: Validate mandatory fields per executor type
  scenarios.forEach((sc, index) => {
    const requiredFields = MANDATORY_FIELDS_MAP[sc.executor];
    if (!requiredFields) {
      throw new Error(
        `❌ Invalid executor type "${sc.executor}" in scenario "${sc.name}".`
      );
    }

    const missingFields = requiredFields.filter((f) => sc[f] === undefined);
    if (missingFields.length > 0) {
      throw new Error(
        `❌ Scenario "${sc.name}" (executor: ${sc.executor}) is missing required fields: ${missingFields.join(
          ", "
        )}`
      );
    }
  });

  // ✅ Step 2: Build scenarios dynamically
  const scenarioDefinitions = scenarios.reduce((acc, sc) => {
    const scenarioConfig = {
      executor: sc.executor,
      exec: sc.exec,
      gracefulStop: sc.gracefulStop,
    };

    const optionalFields = [
      "vus",
      "iterations",
      "startTime",
      "duration",
      "rate",
      "timeUnit",
      "preAllocatedVUs",
      "maxVUs",
      "startVUs",
      "gracefulRampDown",
      "stages",
      "startRate",
    ];
    for (const key of optionalFields) {
      if (sc[key] !== undefined) scenarioConfig[key] = sc[key];
    }

    acc[sc.name] = scenarioConfig;
    return acc;
  }, {});

  // ✅ Step 3: Collect all APIs
  const swaggerPaths = scenarios.flatMap((sc) => {
    if (Array.isArray(sc.api)) {
      return sc.api.map((api) => ({
        method: api.method,
        path: api.path,
      }));
    } else if (typeof sc.api === "object" && sc.api !== null) {
      return [{ method: sc.api.method, path: sc.api.path }];
    }
    return [];
  });

  // ✅ Step 4: Handle thresholds
  const thresholds = config.thresholds || {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  };

  // ✅ Step 5: HTML report path
  const htmlReportPath = `${config.htmlReportFilePath.replace(/\\/g, "/")}/${config.htmlReportName}.html`;

  // ✅ Step 6: Build iteration definition
  const iteration_definition = scenarios
    .map(
      (sc) =>
        `Scenario: ${sc.name}\nDescription: ${sc.description}\nInstruction: ${
          sc.userInstructions || "N/A"
        }`
    )
    .join("\n\n");

  // ✅ Step 7: Create the AI prompt
  const prompt = new PromptTemplate({
    template: k6Template,
    inputVariables: [
      "testName",
      "scenarios",
      "thresholds",
      "swaggerPaths",
      "htmlReportPath",
      "iteration_definition",
    ],
  });

  const formattedPrompt = await prompt.format({
    testName: config.testName || "Generated Load Test",
    scenarios: JSON.stringify(scenarioDefinitions, null, 2),
    thresholds: JSON.stringify(thresholds, null, 2),
    swaggerPaths: JSON.stringify(swaggerPaths, null, 2),
    htmlReportPath,
    iteration_definition,
  });

  console.log("🧠 Sending prompt to Gemini model...");
  const k6Script = await chat.invoke(formattedPrompt);

  if (!k6Script || !k6Script.content) {
    throw new Error("❌ Failed to generate K6 script from GenAI model.");
  }

  // ✅ Step 8: Output file config (from .env)
  const outputDir = process.env.OUTPUT_DIR || "./generated";
  const outputFile = process.env.OUTPUT_FILE || "generated_k6_script.js";
  const outputPath = `${outputDir}/${outputFile}`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, k6Script.content, "utf-8");
  console.log(`✅ Script successfully written to ${outputPath}`);

  return { k6Script, outputPath };
}
