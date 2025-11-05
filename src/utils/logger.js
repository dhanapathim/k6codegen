import { createLogger, format, transports, addColors } from "winston";
import path from "path";
import fs from "fs";

const { combine, timestamp, printf, colorize, json, errors } = format;

const logDir = path.resolve(process.env.LOG_DIR || "./logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const customLevels = {
  levels: { error: 0, warn: 1, info: 2, debug: 3, trace: 4 },
  colors: { error: "red", warn: "yellow", info: "green", debug: "blue", trace: "gray" },
};

addColors(customLevels.colors);

const logger = createLogger({
  levels: customLevels.levels,
  level: "trace",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), json()),
  transports: [
    // 🔴 Error log rotation
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: combine(colorize(), timestamp(), consoleFormat),
      maxsize: Number(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024,
      maxFiles: Number(process.env.LOG_MAX_FILES) || 2,            // keep last 2 rotated files
    }),

    // 🟢 Combined log rotation
    new transports.File({
      filename: path.join(logDir, "combined.log"),
      format: combine(colorize(), timestamp(), consoleFormat),
      maxsize: Number(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024,
      maxFiles: Number(process.env.LOG_MAX_FILES) || 2,               // keep last 2 rotated files
                  
    }),

    // 🟣 Debug log rotation
    new transports.File({
      filename: path.join(logDir, "debug.log"),
      level: "debug",
      format: combine(colorize(), timestamp(), consoleFormat),
      maxsize: Number(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024,
      maxFiles: Number(process.env.LOG_MAX_FILES) || 2,               // keep last 2 rotated files
    }),
  ],
});

// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new transports.Console({
//       format: combine(colorize(), timestamp(), consoleFormat),
//       level: "trace",
//     })
//   );
// }

export default logger;
