import { chat } from "./genai-client.js";
import { k6Template } from "./k6-scenarios-prompt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import logger from "../utils/logger.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ScenarioGenerator } from "./scenario-generator.js";
import { readSwaggerFile } from "./swagger-reader.js";

dotenv.config();

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

export class K6ScenarioGenerator extends ScenarioGenerator {
  constructor() {
    super();
  }

  async generateScenario(data, tool = null) {
    const { config, scenarios } = data;

    // ✅ Step 1: Validate mandatory fields per executor type
    scenarios.forEach((sc) => {
      const requiredFields = MANDATORY_FIELDS_MAP[sc.executor];
      if (!requiredFields) {
        throw new logger.Error(
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

    // ✅ Step 2: Collect Swagger files across all scenarios
    const swaggerFiles = [
      ...new Set(
        scenarios
          .map((s) => s.swaggerFile)
          .filter(Boolean)
          .map((file) => path.resolve(file))
      ),
    ];

    logger.info(`📚 Found ${swaggerFiles.length} Swagger file(s):`);
    swaggerFiles.forEach((file) => logger.info(" -", file));

    // ✅ Step 3: Parse all Swagger files
    const swaggerDocs = swaggerFiles.map((file) => ({
      file,
      content: readSwaggerFile(file),
    }));

    // ✅ Step 4: Build scenario definitions dynamically
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

    // ✅ Step 5: Gather all API endpoints from all scenarios
    const swaggerPaths = scenarios.flatMap((sc) => {
      if (Array.isArray(sc.api)) {
        return sc.api.map((api) => ({
          method: api.method,
          path: api.path,
          swaggerFile: sc.swaggerFile,
        }));
      } else if (typeof sc.api === "object" && sc.api !== null) {
        return [{ method: sc.api.method, path: sc.api.path, swaggerFile: sc.swaggerFile }];
      }
      return [];
    });

    // ✅ Step 6: Set thresholds & report paths
    let thresholds;
    if (config.thresholds && Object.keys(config.thresholds).length > 0) {
      thresholds = {};
      for (const [metric, value] of Object.entries(config.thresholds)) {
        thresholds[metric] = [value];
      }
    } else {
      thresholds = {};
    }

    const htmlReportPath = `${config.htmlReportFilePath.replace(/\\/g, "/")}/${config.htmlReportName}.html`;

    if (tool) {
      logger.info(`🔧 Tool specified: ${tool}`);
    }

    // ✅ Step 7: Build iteration definition summary
    const iteration_definition = scenarios
      .map(
        (sc) =>
          `Scenario: ${sc.name}\nDescription: ${sc.description}\nSwagger: ${sc.swaggerFile}\nInstruction: ${sc.userInstructions || "N/A"
          }`
      )
      .join("\n\n");

    // ✅ Step 8: Build prompt
    const prompt = new PromptTemplate({
      template: k6Template,
      inputVariables: [
        "testName",
        "scenarios",
        "thresholds",
        "swaggerPaths",
        "swaggerDocs",
        "htmlReportPath",
        "iteration_definition",
      ],
    });

    const formattedPrompt = await prompt.format({
      testName: config.testName || "Generated Load Test",
      scenarios: JSON.stringify(scenarioDefinitions, null, 2),
      thresholds: JSON.stringify(thresholds, null, 2),
      swaggerPaths: JSON.stringify(swaggerPaths, null, 2),
      swaggerDocs: JSON.stringify(swaggerDocs, null, 2),
      htmlReportPath,
      iteration_definition,
    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const k6Script = await chat.invoke(formattedPrompt);

    if (!k6Script || !k6Script.content) {
      throw new Error("❌ Failed to generate script from GenAI model.");
    }

    // ✅ Step 9: Write output file
    const outputDir = process.env.OUTPUT_DIR || "./generated";
    const outputFile = process.env.OUTPUT_FILE || "generated_k6_script.js";
    const outputPath = `${outputDir}/${outputFile}`;

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPath, k6Script.content, "utf-8");
    logger.info(`✅ Script successfully written to ${outputPath}`);

    return { k6Script, outputPath };
  }
}
