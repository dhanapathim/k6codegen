import fs from "fs";
import path from "path";
import YAML from "yaml";
import logger from "./logger.js";

export function readSwaggerFile(filePath) {
  if (!filePath) throw Error("Swagger file path is missing.");
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) throw new Error(`Swagger file not found: ${resolvedPath}`);

  const rawData = fs.readFileSync(resolvedPath, "utf-8");
  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === ".yaml" || ext === ".yml") {
    logger.info(`📘 Parsing YAML Swagger file: ${resolvedPath}`);
    return YAML.parse(rawData);
  } else if (ext === ".json") {
    logger.info(`📗 Parsing JSON Swagger file: ${resolvedPath}`);
    return JSON.parse(rawData);
  }

  throw new Error(`Unsupported file type: ${ext}. Use .yaml, .yml, or .json`);
}

