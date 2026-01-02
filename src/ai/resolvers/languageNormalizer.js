export const normalizeLanguage = (language) => {
  if (!language) return undefined;

  const map = {
    js: "js",
    javascript: "js",
    nodejs: "js",

    ts: "ts",
    typescript: "ts"
  };

  return map[language.toLowerCase()];
};
