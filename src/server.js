import cors from 'cors';
import dotenv from 'dotenv';
import express from "express";
import scenarioRoutes from "./routes/scenario-routes.js";

dotenv.config();

// Middleware
const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/scenarios", scenarioRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is running." });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started at ${PORT}.`)
});

