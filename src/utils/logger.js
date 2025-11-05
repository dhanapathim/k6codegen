import { createLogger, format, transports, addColors } from "winston";
import path from "path";
import fs from "fs";

const { combine, timestamp, printf, colorize, json, errors } = format;

// Ensure the logs directory exists
const logDir = path.resolve(process.env.LOG_DIR || "./logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Add custom log levels and colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
    trace: "gray",
  },
};

// Apply custom colors
addColors(customLevels.colors);

// Create the logger instance
const logger = createLogger({
  levels: customLevels.levels,
  level: "trace", // Log everything (can adjust dynamically per env)
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json() // JSON output for files (machine-readable)
  ),
  transports: [
    // File transports
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
    new transports.File({
      filename: path.join(logDir, "debug.log"),
      level: "debug",
    }),
  ],
});

// Add colorized console output for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
      level: "trace", // show all logs on console
    })
  );
}

export default logger;
