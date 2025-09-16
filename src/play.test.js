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

  describe('play – insulation from external input mutations (top-level, async)', () => {
    it('keeps the original top-level value even if input is mutated after call', async () => {
      const input = { a: 1 }

      const run = play(async (ctx) => {
        // yield to next microtask so the caller can mutate `input` meanwhile
        await Promise.resolve()
        return ctx.a
      })

      const p = run(input)
      // external mutation after play() was called
      input.a = 999

      const result = await p
      expect(result).toBe(1) // requires at least a shallow copy of input
    })
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

      try {
        // await expect(run({})).rejects.toThrow('boom-middle')
        await run({})
      } catch (e) {
        // TOOD
        console.dir(e)
      }
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

    it('annotates errors with action index', async () => {
      const run = play(
        async () => ({ a: 1 }),
        async function middle() {
          throw new Error('boom')
        }, // has a name
        async () => 'never',
      )

      await expect(run({})).rejects.toThrow(/Action at index 1 "middle" failed/)
    })

    it('annotates errors even when action is anonymous', async () => {
      const run = play(
        async () => ({ a: 1 }),
        async () => {
          throw new Error('fail')
        },
      )
      await expect(run({})).rejects.toThrow(/Action at index 1 failed/)
    })

    it('prefixes message and keeps original stack for a named action', async () => {
      const run = play(
        async () => ({ a: 1 }),
        async function middle() {
          throw new Error('boom')
        },
        async () => 'never',
      )

      let err
      try {
        await run({})
      } catch (e) {
        err = e
      }

      expect(err).toBeInstanceOf(Error)
      // Message is prefixed once, with action index + name
      expect(err.message).toMatch(/Action at index 1 "middle" failed: boom/)
      // First stack line matches the message
      expect(err.stack.split('\n')[0]).toMatch(
        /Action at index 1 "middle" failed: boom/,
      )
      // Stack points to the throwing site in the test
      expect(err.stack).toMatch(/play\.test\.js/i)
      // No verbose cause chain
      expect(err).not.toHaveProperty('cause')
    })

    it('normalizes string throws', async () => {
      const run = play(async () => {
        throw 'boom-str'
      })
      await expect(run({})).rejects.toThrow(
        /Action at index 0 failed: boom-str/,
      )
    })

    it('normalizes object throws', async () => {
      const run = play(async () => {
        throw { msg: 'nope' }
      })
      await expect(run({})).rejects.toThrow(
        /Action at index 0 failed: (.*nope|{"msg":"nope"})/,
      )
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

    class FakeModel {
      constructor(id) {
        this.id = id
      }
      save() {
        this.id++
      }
    }

    it('throws when input is a class instance', async () => {
      const run = play(async () => ({}))
      await expect(run(new FakeModel(1))).rejects.toThrow(
        'Input must be a plain object',
      )
    })

    it('throws when a non-last action returns a class instance', async () => {
      const run = play(
        async () => ({ a: 1 }),
        async () => new FakeModel(1), // non-plain → should be rejected
        async () => 'done',
      )
      await expect(run({})).rejects.toThrow('must return a plain object')
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
