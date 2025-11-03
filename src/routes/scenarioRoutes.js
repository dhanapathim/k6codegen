import express from "express";
import { createScenario } from "../controllers/scenarioController.js";

const router = express.Router();

router.post("/", createScenario);

export default router;