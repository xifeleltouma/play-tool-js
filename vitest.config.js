/** @type {import('vitest').Config} */
export default {
  test: {
    environment: 'node',
    coverage: { reporter: ['text', 'lcov'] },
  },
}
