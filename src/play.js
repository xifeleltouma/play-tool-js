const isPlainObject = (obj) =>
  obj !== null && typeof obj === 'object' && !Array.isArray(obj)

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

    let current = input

    for (const action of actions) {
      current = await action(current)
    }

    return current
  }
