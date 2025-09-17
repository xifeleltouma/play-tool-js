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
