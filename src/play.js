export const isPlainObject = (v) =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype ||
    Object.getPrototypeOf(v) === null)

export const play =
  (...actions) =>
  async (input = {}) => {
    if (actions.length === 0) {
      throw new Error('play() requires at least one action')
    }

    if (!isPlainObject(input)) {
      throw new TypeError(
        `Input must be a plain object (got ${input === null ? 'null' : typeof input})`,
      )
    }

    let ctx = input

    for (const [index, action] of actions.entries()) {
      const result = await action(ctx)

      const isLast = index + 1 === actions.length

      if (isLast) return result

      if (result === undefined) continue

      if (!isPlainObject(result)) {
        const what = result === null ? 'null' : typeof result
        throw new TypeError(
          `Action at index ${index} must return a plain object when it is not the last action (got ${what}).`,
        )
      }

      ctx = { ...ctx, ...result }
    }
  }
