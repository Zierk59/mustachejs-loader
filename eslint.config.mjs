import globals from "globals";
import parser from "esprima";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.amd,
      ...globals.node,
      Atomics: "readonly",
      SharedArrayBuffer: "readonly",
    },

    parser: parser,
  },

  rules: {
    "no-path-concat": "off",
    "no-process-exit": "error",
    "no-unused-vars": "off",
    "no-undef": "off",
    "no-console": "off",
    "no-const-assign": "off",
  },
}];
