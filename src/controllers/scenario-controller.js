import { generateK6Script } from "../ai/k6-load-script-generator.js";
import { K6Scriptgenerate } from "../ai/k6-generator-scenarios.js";
import logger from "../utils/logger.js";
import fs from "fs";
import path from "path";


function validateSwaggerFile(swaggerFilePath) {

  if (!swaggerFilePath) {
    throw new logger.Error("Swagger file path is missing in the input JSON.");
  }

  const resolvedPath = path.resolve(swaggerFilePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error("Swagger file is invalid or not found.");
  }

  return resolvedPath;
}

export const createScenario = async (req, res) => {
  try {
    const data = req.body;
    logger.info(`Creating scenario with data: ${JSON.stringify(data, null, 2)}`);

    // ✅ Validate Swagger file path
    const swagger = path.resolve(`${data.commonFields.swaggerFile}`);
    const swaggerPath = validateSwaggerFile(swagger);
    logger.info(`✅ Swagger file found at: ${swaggerPath}`);

    // ✅ Wait for the K6 script to be generated
    const { k6Script, outputPath } = await generateK6Script(data);

    logger.info(`Generated k6 script is \n ${JSON.stringify(k6Script)}\n`);
    logger.info("✅ K6 script generated at:", outputPath);

    // ✅ Send only one response
    res.status(201).json({
      message: "✅ K6 script generated successfully",

    });
  } catch (error) {
  
    if (error.message.includes("Swagger")) {
      logger.warn(error.message);
      return res.status(400).json({ error: error.message });
    }

    logger.error("❌ Error creating scenario:", error);
    res.status(500).json({ error: "Failed to generate K6 script" });
  }
};

export const createScenarioload = async (req, res) => {
  try {
    const data = req.body;
    logger.info(`Creating scenario with data: ${JSON.stringify(data, null, 2)}`);

     const swaggerFiles = [
      ...new Set(
        data.scenarios
          .map((sc) => sc.swaggerFile)
          .filter(Boolean)
          .map((file) => path.resolve(file))
      ),
    ];

    if (swaggerFiles.length === 0) {
      throw new logger.Error("No Swagger file paths provided in any scenario.");
    }

    logger.info(`📚 Found ${swaggerFiles.length} Swagger file(s):`);
    swaggerFiles.forEach((file) => {
      const validated = validateSwaggerFile(file);
      logger.info(`✅ Validated Swagger file: ${validated}`);
    });



    // ✅ Wait for the K6 script to be generated
    const { k6Script, outputPath } = await K6Scriptgenerate(data);

    logger.info(`Generated k6 script is \n ${JSON.stringify(k6Script)}\n`);
    logger.info("✅ K6 script generated at:", outputPath);

    // ✅ Send only one response
    res.status(201).json({
      message: "✅ K6 script generated successfully",

    });
  } catch (error) {
    if (error.message.includes("Swagger file")) {
      logger.warn(error.message);
      return res.status(400).json({ error: error.message });
    }

    logger.error("❌ Error creating scenario:", error);
    res.status(500).json({ error: "Failed to generate K6 script" });
  }
};