import { describe, expect, it } from 'vitest'
import { createSerializedTask } from '../src/utils/helpers.ts'

describe('createSerializedTask', () => {
  it('runs calls strictly one at a time', async () => {
    const order: string[] = []
    const run = createSerializedTask(async (label: string, delay: number) => {
      await new Promise((resolve) => setTimeout(resolve, delay))
      order.push(label)
      return label
    })

    const all = Promise.all([run('slow', 20), run('fast', 0)])
    expect(await all).toEqual(['slow', 'fast'])
    expect(order).toEqual(['slow', 'fast'])
  })

  it('surfaces a rejection to the caller instead of resolving null', async () => {
    const run = createSerializedTask(async (fail: boolean) => {
      if (fail) throw new Error('boom')
      return 'ok'
    })

    await expect(run(true)).rejects.toThrow('boom')
  })

  it('keeps the queue running after a rejection', async () => {
    const run = createSerializedTask(async (fail: boolean) => {
      if (fail) throw new Error('boom')
      return 'ok'
    })

    await expect(run(true)).rejects.toThrow('boom')
    await expect(run(false)).resolves.toBe('ok')
  })
})
