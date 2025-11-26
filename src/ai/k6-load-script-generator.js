import { chat } from "./genai-client.js";
import { k6Template } from "./k6-scenarios-load-prompt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import logger from "../utils/logger.js";
import fs from "fs";
import path from "path";
import { LoadScriptGenerator } from "./load-script-generator.js";
import { readSwaggerFile } from "./swagger-reader.js";

export class K6LoadScriptGenerator extends LoadScriptGenerator {
  constructor() {
    super();
  }

  async generateLoadScript(data, tool = null) {
    const { scenarios, commonFields } = data;

    let swaggerFile;
    try {
      swaggerFile = path.resolve(`${commonFields.swaggerFile}`);
      logger.info(`📄 Reading Swagger file from: ${swaggerFile}`);
    } catch (error) {
      logger.error("❌", error.message);
      throw new logger.Error(error.message);
    }

    const swaggerJson = readSwaggerFile(swaggerFile);

    const { hours, minutes, seconds } = commonFields.duration;
    const formattedDuration =
      `${hours ? hours + "h" : ""}${minutes ? minutes + "m" : ""}${seconds ? seconds + "s" : ""}` || "1m";

    const stages = scenarios.reduce((acc, sc) => {
      acc[sc.name] = {
        executor: commonFields.executor,
        vus: sc.virtualUser,
        duration: formattedDuration,
        startTime: sc.startTime,
      };
      return acc;
    }, {});

    const iteration_definition = commonFields.iterationDefinition || "";
    const manualSwaggerPaths = commonFields.apis.map((api) => ({
      method: api.method,
      path: api.pathName,
    }));

    // Handle new thresholds format: object with metric names as keys and values as strings/numbers
    // K6 expects arrays like ["p(95)<2000"], so wrap each value in an array
    let thresholds;
    if (commonFields.thresholds && Object.keys(commonFields.thresholds).length > 0) {
      thresholds = {};
      for (const [metric, value] of Object.entries(commonFields.thresholds)) {
        thresholds[metric] = [value];
      }
    } else {
      thresholds = {};
    }

    const htmlReportPath = `${commonFields.htmlReportFilePath}/${commonFields.htmlReportName}.html`;

    if (tool) {
      logger.info(`🔧 Tool specified: ${tool}`);
    }

    const prompt = new PromptTemplate({
      template: k6Template,
      inputVariables: [
        "stages",
        "thresholds",
        "swaggerPaths",
        "htmlReportPath",
        "iteration_definition",
        "swaggerJson",
      ],
    });

    const formattedPrompt = await prompt.format({
      stages: JSON.stringify(stages, null, 2),
      thresholds: JSON.stringify(thresholds, null, 2),
      swaggerPaths: JSON.stringify(manualSwaggerPaths, null, 2),
      iteration_definition,
      swaggerJson,
      htmlReportPath,
    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const k6Script = await chat.invoke(formattedPrompt);

    logger.info("------------Generated K6 Script:-------------");
    logger.info(k6Script.content);

    const outputDir = process.env.OUTPUT_DIR || "./generated";
    const outputFile = process.env.OUTPUT_LOAD_FILE_NAME || "generated_k6_load_script.js";

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputPath = `${outputDir}/${outputFile}`;
    fs.writeFileSync(outputPath, k6Script.content, "utf-8");

    return { k6Script, outputPath };
  }
}
