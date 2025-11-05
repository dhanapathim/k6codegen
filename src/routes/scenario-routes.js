import express from "express";
import { createScenario, createScenarioload } from "../controllers/scenarioController.js";

const router = express.Router();

router.post("/load", createScenario);
router.post("/", createScenarioload);

export default router;