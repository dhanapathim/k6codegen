import { createChatModel } from "../genai-client.js";
import { JMeterTemplate } from "../prompts/jmeter-load-promt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import { LoadScriptGenerator } from "./load-script-generator.js";
import logger from "../../utils/logger.js";
import fs from "fs";
import path from "path";
import { readSwaggerFile } from "../../utils/swagger-reader.js";
import { CodeFenceCleaner } from "../../utils/code-cleaner.js";
import dotenv from "dotenv";

dotenv.config();

export class JMeterLoadScriptGenerator extends LoadScriptGenerator {
  constructor() {
    super();
  }

  async generateLoadScript(data) {
    const { scenarios, commonFields } = data;
    const tool = data.commonFields.tool;
    // Create chat model with system prompt for JMeter load script generation
    const chat = createChatModel({ tool, mode: "load" });
    
    const fullPath = path.join(process.env.BASE_PATH, data.commonFields.swaggerFile);
    let swaggerFile;
    try {
      swaggerFile = path.resolve(fullPath);
      logger.info(`📄 Reading Swagger file from: ${swaggerFile}`);
    } catch (error) {
      logger.error("❌", error.message);
      throw new logger.Error(error.message);
    }

    const swaggerJson = readSwaggerFile(swaggerFile);

    const threadGroups = scenarios.reduce((acc, sc) => {
      acc[sc.name] = {
        threads: sc.threads,
        rampUp: sc.rampUp,
        duration: sc.duration,
        delay: sc.delay,
      };
      return acc;
    }, {});

    const iteration_definition = commonFields.userInstructions || "";
    const manualSwaggerPaths = commonFields.apis.map((api) => ({
      method: api.method,
      path: api.pathName,
    }));

   
    if (tool) {
      logger.info(`🔧 Tool specified: ${tool}`);
    }
    const outputDir = process.env.OUTPUT_DIR || "./generated";
    const outputFile = process.env.OUTPUT_LOAD_FILE_NAME || "generated_k6_load_script";
    //const packageName = getPackageFromFile(outputDir);

    const prompt = new PromptTemplate({
      template: JMeterTemplate,
      inputVariables: [
        "threadGroups",
        "swaggerPaths",
        "iteration_definition",
        "swaggerJson",

        "outputFile"
      ],
    });

    const formattedPrompt = await prompt.format({
      threadGroups: JSON.stringify(threadGroups, null, 2),
      swaggerPaths: JSON.stringify(manualSwaggerPaths, null, 2),
      iteration_definition,
      swaggerJson,
      outputFile: outputFile,
    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const Script = await chat.invoke(formattedPrompt);

    logger.info("------------Generated K6 Script:-------------");
    logger.info(Script.content);


    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputPath = `${outputDir}/${outputFile}.java`;
    fs.writeFileSync(outputPath, Script.content, "utf-8");
    const cleaner = new CodeFenceCleaner(outputDir, [".js", ".ts", ".java"]);
    cleaner.clean();
    return { Script, outputPath };
  }


}