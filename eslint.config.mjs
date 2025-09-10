import js from "@eslint/js"
import globals from "globals"
import jsonc from "eslint-plugin-jsonc"
import jsoncParser from "jsonc-eslint-parser"
import { defineConfig } from "eslint/config"

export default defineConfig([
  // JS
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { ...js.configs.recommended.rules, semi: ['error', 'never'] }
  },

  // JSON (package.json, etc.)
  {
    files: ["**/*.json"],
    languageOptions: { parser: jsoncParser },
    plugins: { jsonc },
    rules: {
      ...jsonc.configs["recommended-with-json"].rules,
      // Optional stylistic tweaks:
      "jsonc/indent": ["error", 2],
      "jsonc/quotes": ["error", "double"],
      "jsonc/object-curly-spacing": ["error", "always"]
    }
  }
])
