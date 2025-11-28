import express from "express";
import { createLoad, createScenario } from "../controllers/scenario-controller.js";

const router = express.Router();

router.post("/load", createLoad);
router.post("/", createScenario);

export default router;