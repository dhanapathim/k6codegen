import express from "express";
import { createLoad, createScenario, projectSetup } from "../controllers/scenario-controller.js";


const router = express.Router();

router.post("/load", projectSetup, createLoad);
router.post("/", projectSetup, createScenario);

export default router;