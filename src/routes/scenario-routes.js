import express from "express";
import { createLoad, createScenario, Projectsetup } from "../controllers/scenario-controller.js";


const router = express.Router();

router.post("/load",Projectsetup, createLoad);
router.post("/", Projectsetup,createScenario);

export default router;