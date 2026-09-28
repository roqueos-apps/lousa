import { describe, it, expect } from 'vitest'
import { createBoardHistory } from '../src/history.js'

describe('whiteboard/history', () => {
  it('push / undo / redo round-trips snapshots', () => {
    const h = createBoardHistory()
    h.push([])
    h.push([{ id: 1 }])
    h.push([{ id: 2 }])
    expect(h.canUndo()).toBe(true)
    expect(h.canRedo()).toBe(false)

    expect(h.undo()).toEqual([{ id: 1 }])
    expect(h.canRedo()).toBe(true)
    expect(h.redo()).toEqual([{ id: 2 }])
  })

  it('truncates the redo tail on a new push', () => {
    const h = createBoardHistory()
    h.push([])
    h.push([{ id: 1 }])
    h.undo()
    h.push([{ id: 9 }])
    expect(h.canRedo()).toBe(false)
    expect(h.redo()).toBeNull()
  })

  it('clones snapshots (no shared references)', () => {
    const h = createBoardHistory()
    const a = [{ id: 1, x: 0 }]
    h.push([])
    h.push(a)
    a[0].x = 999
    h.undo()
    const back = h.redo()
    expect(back[0].x).toBe(0)
  })

  it('caps the stack length', () => {
    const h = createBoardHistory({ max: 4 })
    for (let i = 0; i < 20; i++) h.push([{ id: i }])
    expect(h._state().length).toBeLessThanOrEqual(4)
  })
})
