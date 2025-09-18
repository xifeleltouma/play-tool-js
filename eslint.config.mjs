import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginNoOnlyTests from 'eslint-plugin-no-only-tests'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**'] },

  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      'no-only-tests': pluginNoOnlyTests,
    },
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

  // Block describe.only / it.only / test.only in test files
  {
    files: ['**/*.test.{js,mjs,cjs}', '**/*.spec.{js,mjs,cjs}'],
    rules: {
      'no-only-tests/no-only-tests': 'error',
    },
  },

  // Must remain last to disable ESLint rules that conflict with Prettier
  eslintConfigPrettier,
])
