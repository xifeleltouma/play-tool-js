export const isPlainObject = (v) =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype ||
    Object.getPrototypeOf(v) === null)

// Normalizes any thrown value into an Error.
// - Preserves stack when it's already an Error.
// - Stringifies plain objects safely.
export const toError = (err) => {
  if (err instanceof Error) return err
  try {
    if (typeof err === 'string') return new Error(err)
    // JSON stringify may fail on circulars; fallback to String(err)
    return new Error(JSON.stringify(err))
  } catch {
    return new Error(String(err))
  }
}

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

    // Snapshot input once.
    // NOTE: This is a *shallow* copy: it prevents external top-level mutations
    // from affecting this run, but nested objects/arrays remain shared references.
    // FUTURE IMPROVEMENTS (pick one if/when needed):
    // - Use `structuredClone(input)` (or a deep-copy fallback) to also snapshot nested values.
    // - Pass a deep read-only Proxy view of `ctx` into actions to prevent in-action mutations.
    // - Enforce POJOs more strictly (prototype check) so class/model instances are rejected.
    // - Optionally enable the Proxy only in dev (NODE_ENV !== 'production') to keep prod fast.
    let ctx = { ...input }
    const intial = { ...input }

    for (const [index, action] of actions.entries()) {
      let result
      try {
        result = await action(ctx, { input: intial })
      } catch (err) {
        const label = action.name
        const e = toError(err)
        // Keep original stack if it was an Error; just prefix the message
        e.message = `Action at index ${index}${label ? ` "${label}"` : ''} failed: ${e.message}`
        throw e
      }

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
