    ### play-tool

A tiny async pipeline helper for composing steps that share a context.

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

### API

#### `play(...actions) -> (input?) => Promise<any>`

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

#### Errors

- If validation fails (no actions, bad input, non-object from a non-last action), a `TypeError`/`Error` is thrown.
- If an action throws/rejects, its error is rethrown with a short prefix:
  `Action at index N "actionName" failed: <original message>`

  ### Example

```js
import { play } from 'play-tool'

const stepA = async (ctx, { input }) => {
  return { a: input.a + 1 } // { a: 2 }
}

const stepB = async (ctx) => {
  return { b: ctx.a * 2 } // { a: 2, b: 4 }
}

const stepC = async (ctx, { input }) => {
  return ctx.b + input.a // -> 4 + 1 = 5 (last may return non-object)
}

const pipeline = play(stepA, stepB, stepC)

await pipeline({ a: 1 }) // => 5
```

### License

This project is licensed under the **ISC License**.

- See the full text in [`LICENSE`](./LICENSE).
- SPDX: `ISC`
- © 2025 Your Name

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)
