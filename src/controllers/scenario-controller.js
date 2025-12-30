import logger from "../utils/logger.js";
import fs from "fs";
import { loadtoolHandlers } from "./toolHandlers.js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

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

export const createLoad = async (req, res) => {
  try {
    const data = req.body;
    const tool = data.commonFields.tool?.toLowerCase();
    logger.info(`Creating scenario with tool: ${tool}`);
    logger.info(`Creating scenario with data: ${JSON.stringify(data, null, 2)}`);

    // Validate swagger path
    const fullPath = path.join(process.env.BASE_PATH, data.commonFields.swaggerFile);
    const swaggerPath = validateSwaggerFile(path.resolve(fullPath));
    logger.info(`✅ Swagger file found at: ${swaggerPath}`);

    // Get handler dynamically
    const handler = loadtoolHandlers[tool];

    if (!handler) {
      return res.status(400).json({ message: "❌ Invalid tool selected" });
    }

    // Call selected tool generator
    const { Script, outputPath } = await handler(data);

    logger.info(`Generated script:\n ${JSON.stringify(Script)}`);
    logger.info(`Script generated at: ${outputPath}`);

    return res.status(201).json({
      message: "✅ Script generated successfully",
    });

  } catch (error) {
    if (error.message.includes("Swagger")) {
      logger.warn(error.message);
      return res.status(400).json({ error: error.message });
    }

    logger.error("❌ Error creating scenario:", error);
    return res.status(500).json({ error: "Failed to generate script" });
  }
};

export const createScenario = async (req, res) => {
  try {
    const data = req.body;
    const tool = data.config.tool?.toLowerCase();
    logger.info(`Creating scenario with data: ${JSON.stringify(data, null, 2)}`);
    logger.info(`🔧 Selected tool: ${tool}`);

    // -------------------------------
    //  Validate Swagger file paths
    // -------------------------------

    const swaggerFiles = [
      ...new Set(
        data.scenarios
          .map((sc) => sc.swaggerFile)
          .filter(Boolean)
          .map((file) => path.resolve(process.env.BASE_PATH, file))
      ),
    ];

    if (swaggerFiles.length === 0) {
      throw new Error("No Swagger file paths provided in any scenario.");
    }

    logger.info(`📚 Found ${swaggerFiles.length} Swagger file(s):`);
    swaggerFiles.forEach((file) => {
      const valid = validateSwaggerFile(file);
      logger.info(`✅ Validated Swagger file: ${valid}`);
    });

    //  Dynamic tool selection    
    const handler = scenariotoolHandlers[tool];

    if (!handler) {
      return res.status(400).json({ message: "❌ Invalid or no tool selected" });
    }

    // Call the appropriate generator
    const { Script, outputPath } = await handler(data, tool);

    logger.info(`Generated script:\n${JSON.stringify(Script)}`);
    logger.info(`📄 Output generated at: ${outputPath}`);

    return res.status(201).json({
      message: "✅ Script generated successfully",
    });

  } catch (error) {
    if (error.message.includes("Swagger file")) {
      logger.warn(error.message);
      return res.status(400).json({ error: error.message });
    }

    logger.error("❌ Error creating scenario:", error);
    return res.status(500).json({ error: "Failed to generate script" });
  }
};
