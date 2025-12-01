import { createChatModel } from "../genai-client.js";
import { k6Template } from "../prompts/k6-scenarios-load-prompt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import logger from "../../utils/logger.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { LoadScriptGenerator } from "./load-script-generator.js";
import { readSwaggerFile } from "../../utils/swagger-reader.js";
import { CodeFenceCleaner } from "../../utils/code-cleaner.js";


dotenv.config();

export class K6LoadScriptGenerator extends LoadScriptGenerator {
  constructor() {
    super();
  }

  async generateLoadScript(data) {
    const { scenarios, commonFields } = data;

    const tool = data.commonFields.tool;
  // Create chat model with system prompt for JMeter load script generation
    const chat = createChatModel({ tool, mode: "load" });

    let swaggerFile;
    const fullPath = path.join(process.env.BASE_PATH, data.commonFields.swaggerFile);

    try {
      swaggerFile = path.resolve(fullPath);
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


    let thresholds;
    if (commonFields.thresholds && Object.keys(commonFields.thresholds).length > 0) {
      thresholds = {};
      for (const [metric, value] of Object.entries(commonFields.thresholds)) {
        thresholds[metric] = [value];
      }
    } else {
      thresholds = {};
    }

    const htmlReportPath = `${commonFields.htmlReportFilePath}`;
    const htmlReportName = `${commonFields.htmlReportName}`;

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
        "htmlReportName",
        "iteration_definition",
        "swaggerJson",
      ],
    });

    const formattedPrompt = await prompt.format({
      stages: JSON.stringify(stages, null, 2),
      thresholds: JSON.stringify(thresholds, null, 2),
      swaggerPaths: JSON.stringify(manualSwaggerPaths, null, 2),
      iteration_definition,
      htmlReportName,
      swaggerJson,
      htmlReportPath,
    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const Script = await chat.invoke(formattedPrompt);

    logger.info("------------Generated K6 Script:-------------");
    logger.info(Script.content);

    const outputDir = process.env.OUTPUT_DIR || "./generated";
    const outputFile = process.env.OUTPUT_LOAD_FILE_NAME || "generated_k6_load_script.js";

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputPath = `${outputDir}/${outputFile}.js`;
    fs.writeFileSync(outputPath, Script.content, "utf-8");
    const cleaner = new CodeFenceCleaner(outputDir, [".js", ".ts", ".java"]);
    cleaner.clean();

    return { Script, outputPath };
  }
}
