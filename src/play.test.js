import { describe, expect, it } from 'vitest'

import { play } from './play'

describe('success', () => {
  it('allows the last action to return an object and only returns the result of the last action', async () => {
    const fn = play(
      async () => ({ a: 1 }),
      async () => ({ b: 2 }),
    )
    const result = await play(fn)({})
    expect(result).to.toBeTypeOf('object')
    expect(result.a).to.equal(undefined)
    expect(result.b).to.equal(2)
  })

  it('allows the last action to return a non-object (e.g. string)', async () => {
    const run = play(
      async () => ({}),
      async () => 'done',
    )

    const result = await run({})

    expect(result).toBe('done')
  })

  describe('context propagation', () => {
    it('merges result into ctx and passes it to the next action', async () => {
      const run = play(
        async () => ({ a: 1 }), // non-last → must return object → merged
        async (ctx) => ({ b: ctx.a + 1 }), // sees { a:1 } → returns { b:2 } → merged
        async (ctx) => ctx.b === 2, // last → can return non-object (boolean)
      )

      const result = await run({})
      expect(result).toBe(true)
    })

    it('later action overwrites a field and next action sees the new value', async () => {
      const run = play(
        async () => ({ a: 1 }),
        async () => ({ a: 2 }), // (overwrites)
        async (ctx) => ctx.a, // last returns 2
      )

      const result = await run({})
      expect(result).toBe(2)
    })
    it('keeps previous ctx if a non-last action returns undefined', async () => {
      const run = play(
        async () => ({ a: 1 }), // ctx = { a:1 }
        async () => undefined, // skipped, ctx stays { a:1 }
        async (ctx) => ctx.a, // last → should still see 1
      )

      const result = await run({})
      expect(result).toBe(1)
    })

    it('skips multiple actions returning undefined and preserves ctx', async () => {
      const run = play(
        async () => ({ a: 1 }), // ctx = { a:1 }
        async () => undefined, // skipped
        async () => undefined, // skipped
        async (ctx) => ctx.a, // last → should still see 1
      )

      const result = await run({})
      expect(result).toBe(1)
    })
  })

  it('runs actions in order via ctx chaining', async () => {
    const run = play(
      async () => ({ seq: 'a' }),
      async (ctx) => ({ seq: ctx.seq + 'b' }),
      async (ctx) => ctx.seq + 'c', // last may return non-object
    )

    const result = await run({})
    expect(result).toBe('abc')
  })
})

describe('failure', () => {
  describe('actions', () => {
    it('throws if no actions are provided', async () => {
      await expect(play()({})).rejects.toThrow('requires at least one action')
    })
  })

  describe('error handling', () => {
    it('stops on middle error; last is not executed', async () => {
      const run = play(
        async () => ({ step: 1 }),
        async () => {
          throw new Error('boom-middle')
        },
        // if this ran, the error message would change
        async () => {
          throw new Error('should-not-run')
        },
      )

      await expect(run({})).rejects.toThrow('boom-middle')
    })

    it('bubbles error from the first action', async () => {
      const run = play(
        async () => {
          throw new Error('boom-first')
        },
        async () => ({ ok: true }),
        async () => 'done',
      )

      await expect(run({})).rejects.toThrow('boom-first')
    })

    it('bubbles error from the last action', async () => {
      const run = play(
        async () => ({ step: 1 }),
        async (ctx) => ({ step: ctx.step + 1 }),
        async () => {
          throw new Error('boom-last')
        },
      )

      await expect(run({})).rejects.toThrow('boom-last')
    })
  })

  describe('input', () => {
    it('throws if input is null', async () => {
      const fn = play(async () => ({}))
      await expect(fn(null)).rejects.toThrow('Input must be a plain object')
    })

    it('throws if input is a primitive', async () => {
      const run = play(async () => ({}))
      await expect(run(1)).rejects.toThrow('Input must be a plain object')
    })

    it('throws if input is an array', async () => {
      const run = play(async () => ({}))
      await expect(run([])).rejects.toThrow('Input must be a plain object')
    })
  })

  describe('non-last action', () => {
    it('throws if a non-last action returns null', async () => {
      const run = play(
        async () => null,
        async () => ({}),
      )
      await expect(run({})).rejects.toThrow('must return a plain object')
    })

    it('throws if a non-last action returns a primitive', async () => {
      const run = play(
        async () => 123,
        async () => ({}),
      )
      await expect(run({})).rejects.toThrow('must return a plain object')
    })

    it('throws if a non-last action returns an array', async () => {
      const run = play(
        async () => [],
        async () => ({}),
      )
      await expect(run({})).rejects.toThrow('must return a plain object')
    })
  })
})
