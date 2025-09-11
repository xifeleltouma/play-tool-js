import { describe, expect, it } from 'vitest'

import { play } from './index'

describe('success', () => {
  it('returns an object', async () => {
    const input = {}
    const result = await play()(input)
    expect(result).to.toBeTypeOf('object')
  })
})
