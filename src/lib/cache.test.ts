import { describe, it, expect } from 'vitest'

function keyOf(subreddits: string[], query = '', sort='hot', time='day', page=0) {
  return JSON.stringify([subreddits.slice().sort(), query, sort, time, page])
}

describe('cache key', () => {
  it('is order-insensitive for subreddits', () => {
    expect(keyOf(['a','b'], 'q')).toBe(keyOf(['b','a'], 'q'))
  })
})

