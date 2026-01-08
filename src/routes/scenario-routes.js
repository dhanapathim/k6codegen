import express from "express";
import { createLoad, createScenario, projectSetup } from "../controllers/scenario-controller.js";


const router = express.Router();

router.post("/k6/load", projectSetup, createLoad);
router.post("/k6", projectSetup, createScenario);

router.post("/Jmeter/load", createLoad);
router.post("/Jmeter", createScenario);

export default router;