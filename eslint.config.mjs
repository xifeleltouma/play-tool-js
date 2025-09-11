import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  // Must remain last to disable ESLint rules that conflict with Prettier
  eslintConfigPrettier,
])
