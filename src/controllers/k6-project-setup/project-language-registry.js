// projectLanguageRegistry.js
import { ProjectInitializerJS } from "./projectInitializerjs.js";
import { ProjectInitializerTS } from "./projectInitializerts.js";

export const PROJECT_LANGUAGE_REGISTRY = Object.freeze({
  javascript: ProjectInitializerJS,
  js: ProjectInitializerJS,

  typescript: ProjectInitializerTS,
  ts: ProjectInitializerTS,
});
