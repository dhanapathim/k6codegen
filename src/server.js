import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import logger from "./utils/logger.js"; // ✅ Centralized logger
import scenarioRoutes from "./routes/scenario-routes.js";

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// ✅ Log all HTTP requests using Morgan + Winston
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// ✅ Routes
app.use("/api/scenarios", scenarioRoutes);

// ✅ Health check route
app.get("/health", (req, res) => {
  logger.info("Health check endpoint called");
  res.status(200).json({ message: "Server is running." });
});

// ✅ Centralized error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Server started on port ${PORT}`);
});
