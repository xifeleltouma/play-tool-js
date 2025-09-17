    ### play-tool

A tiny async pipeline helper for composing steps that share a context.

👉 [View on npm](https://www.npmjs.com/package/@felixfelix/play-tool)

### Install

```bash
npm i play-tool
# or
pnpm add play-tool
```

### Quickstart

```js
import { play } from 'play-tool'

// Each action: async (ctx, { input }) => result
const loadCart = async (ctx, { input }) => {
  const cart = await fetchCart(input.cartId) // your own function
  return { cart }
}

const calculateTotal = (ctx) => {
  const total = ctx.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  return { total }
}

const processPayment = async (ctx) => {
  await charge(ctx.total)
  return { success: true }
}

const checkout = play(loadCart, calculateTotal, processPayment)

// Run the pipeline
await checkout({ cartId: 'c_123' })
```

#### `init` for custom pipelines

`play` is just `init` with defaults:

- stops on `{ stop: true }`
- strips the `stop` key before returning.

Use `init` when you need your own rules:

```js
import { init } from 'play-tool'

// Example: stop early on HTTP Response
const httpPlay = init({
  stop: (r) => r instanceof Response,
  toOutput: (r) => r,
})

const pipeline = httpPlay(
  async (ctx) =>
    ctx.user
      ? { user: ctx.user }
      : new Response('Unauthorized', { status: 401 }),
  async (ctx) => new Response(`Hello ${ctx.user.name}`, { status: 200 }),
)

await pipeline({ user: null }) // -> Response(401)
```

### API

### `init(config) -> (...actions) => (input?) => Promise<any>`

The core primitive. Creates a pipeline runner with customizable rules.

- **`config.stop(result)`** → return `true` to stop early.
- **`config.toOutput(result)`** → map the final result before returning.

#### `play(...actions) -> (input?) => Promise<any>`

A preconfigured `init` with sensible defaults:

- Stops on `{ stop: true }`.
- Strips the `stop` key before returning.
- Shallow-merges results into the shared context.

- **Action signature:** `async (ctx, { input }) => result`
  - `ctx`: running context. Starts as a **shallow copy** of `input`, then is shallow-merged with each non-last result.
  - `{ input }`: the **same shallow snapshot** of the original input, passed to **every** action (read/reference only).

#### Contract

- **At least one action** is required.
- **`input` must be a POJO** (plain object). Class/model instances are rejected.
- **Merging is shallow** (top-level keys). Later keys overwrite earlier ones.

#### Return rules

- **Non-last actions:** must return a **plain object** or `undefined`.
  - `undefined` → no merge; `ctx` is unchanged for the next action.
- **Last action:** can return **anything** (object or non-object). This becomes the pipeline result.
- **Early return:** any action can return an object with `{ stop: true, ... }`  
  → the pipeline stops immediately, removes the `stop` key, and returns the rest as the final result.

#### Errors

- If validation fails (no actions, bad input, non-object from a non-last action), a `TypeError`/`Error` is thrown.
- If an action throws/rejects, its error is rethrown with a short prefix:
  `Action at index N "actionName" failed: <original message>`

### License

This project is licensed under the **ISC License**.

- See the full text in [`LICENSE`](./LICENSE).
- SPDX: `ISC`
- © 2025 xifelxifel

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)

```

```
