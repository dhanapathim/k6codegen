// projectLanguageRegistry.js
import { ProjectInitializerJS } from "./ProjectInitializerJS.js";
import { ProjectInitializerTS } from "./ProjectInitializerTS.js";

export const PROJECT_LANGUAGE_REGISTRY = Object.freeze({
  javascript: ProjectInitializerJS,
  js: ProjectInitializerJS,

  typescript: ProjectInitializerTS,
  ts: ProjectInitializerTS,
});
