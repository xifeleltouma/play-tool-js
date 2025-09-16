import { describe, expect, it } from 'vitest'

import { play } from './play'

describe('success', () => {
  it('returns an object', async () => {
    const input = {}
    const fn = play(async () => ({}))
    const result = await play(fn)(input)
    expect(result).to.toBeTypeOf('object')
  })
})

describe('failure', () => {
  it('throws if no actions are provided', async () => {
    await expect(play()({})).rejects.toThrow('requires at least one action')
  })

  it('throws if input is null', async () => {
    const fn = play(async () => ({}))
    await expect(fn(null)).rejects.toThrow('Input must be a plain object')
  })

  it('throws if input is a primitive', async () => {
    const fn = play(async () => ({}))
    await expect(fn(1)).rejects.toThrow('Input must be a plain object')
  })

  it('throws if input is an array', async () => {
    const fn = play(async () => ({}))
    await expect(fn([])).rejects.toThrow('Input must be a plain object')
  })
})
