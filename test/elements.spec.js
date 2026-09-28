import { describe, it, expect } from 'vitest'
import {
  createElement,
  finalizeDraft,
  pushFreehandPoint,
  growDraft,
  freehandPathD,
  segmentEnds,
  migrateElement,
  boardToText,
} from '../src/elements.js'

describe('whiteboard/elements', () => {
  it('createElement makes a zero-size bbox element with style', () => {
    const el = createElement('rectangle', 10, 20, { stroke: '#f00', strokeWidth: 4 })
    expect(el).toMatchObject({
      type: 'rectangle',
      x: 10,
      y: 20,
      w: 0,
      h: 0,
      angle: 0,
      stroke: '#f00',
      strokeWidth: 4,
    })
    expect(el.id).toBeTruthy()
  })

  it('finalizeDraft normalizes a freehand stroke into [0,1] points', () => {
    const el = createElement('pencil', 0, 0, {})
    pushFreehandPoint(el, 10, 10)
    pushFreehandPoint(el, 30, 50)
    const kept = finalizeDraft(el)
    expect(kept).toBe(true)
    expect(el._raw).toBeUndefined()
    expect(el.x).toBe(0)
    expect(el.y).toBe(0)
    expect(el.w).toBe(30)
    expect(el.h).toBe(50)
    // points normalized: last point (30,50) → (1,1)
    expect(el.points.slice(-2)).toEqual([1, 1])
  })

  it('finalizeDraft rejects a too-small shape', () => {
    const el = createElement('rectangle', 0, 0, {})
    growDraft(el, 1, 1)
    expect(finalizeDraft(el)).toBe(false)
  })

  it('finalizeDraft encodes segment direction + makes a positive bbox', () => {
    const el = createElement('line', 100, 100, {})
    growDraft(el, 40, 40) // dragged up-left → negative w/h
    expect(finalizeDraft(el)).toBe(true)
    expect(el.w).toBeGreaterThan(0)
    expect(el.h).toBeGreaterThan(0)
    const ends = segmentEnds(el)
    // the line should still run between the original two points
    const xs = [ends.x1, ends.x2].sort((a, b) => a - b)
    expect(xs[0]).toBeCloseTo(40, 4)
    expect(xs[1]).toBeCloseTo(100, 4)
  })

  it('freehandPathD builds an M…L… path', () => {
    const el = { type: 'pencil', x: 0, y: 0, w: 100, h: 100, points: [0, 0, 1, 1] }
    expect(freehandPathD(el)).toBe('M 0 0 L 100 100')
  })

  it('migrateElement converts a legacy signed-bbox shape', () => {
    const old = {
      id: 1,
      type: 'rectangle',
      x: 0,
      y: 0,
      width: -50,
      height: 30,
      strokeColor: '#abc',
    }
    const el = migrateElement(old)
    expect(el.x).toBe(-50)
    expect(el.w).toBe(50)
    expect(el.h).toBe(30)
    expect(el.stroke).toBe('#abc')
    expect(el.angle).toBe(0)
  })

  it('migrateElement passes through a new-model element untouched', () => {
    const cur = { id: 'x', type: 'rectangle', x: 1, y: 2, w: 3, h: 4, angle: 0 }
    expect(migrateElement(cur)).toBe(cur)
  })
})

describe('boardToText: the board as something an agent can read', () => {
  const sticky = (x, y, text) => ({ type: 'sticky', x, y, text })

  it('reads a wall of notes left to right, top to bottom', () => {
    // A whiteboard is spatial: the order people read it in is the order the
    // notes have to reach the model, or a brainstorm arrives shuffled.
    const board = [
      sticky(300, 10, 'segundo'),
      sticky(10, 200, 'terceiro'),
      sticky(10, 10, 'primeiro'),
    ]
    expect(boardToText(board)).toBe('primeiro | segundo\nterceiro')
  })

  it('treats notes at slightly different heights as the same row', () => {
    // Nobody aligns sticky notes to the pixel.
    const board = [sticky(200, 45, 'direita'), sticky(10, 10, 'esquerda')]
    expect(boardToText(board)).toBe('esquerda | direita')
  })

  it('starts a new line when the gap is a real row apart', () => {
    const board = [sticky(10, 10, 'em cima'), sticky(10, 400, 'embaixo')]
    expect(boardToText(board)).toBe('em cima\nembaixo')
  })

  it('ignores shapes and strokes, which carry no words', () => {
    const board = [
      { type: 'rectangle', x: 0, y: 0 },
      { type: 'pencil', x: 5, y: 5, points: [0, 0, 1, 1] },
      sticky(10, 10, 'a única ideia'),
    ]
    expect(boardToText(board)).toBe('a única ideia')
  })

  it('returns empty for a board with nothing written on it', () => {
    expect(boardToText([{ type: 'rectangle', x: 0, y: 0 }])).toBe('')
    expect(boardToText([sticky(0, 0, '   ')])).toBe('')
    expect(boardToText([])).toBe('')
    expect(boardToText(null)).toBe('')
  })

  it('collapses the newlines a sticky note carries inside it', () => {
    // Otherwise one note would look like several rows to the model.
    expect(boardToText([sticky(0, 0, 'linha um\n\nlinha dois')])).toBe('linha um linha dois')
  })

  it('caps the output, because a full board can be enormous', () => {
    const board = Array.from({ length: 200 }, (_, i) => sticky(0, i * 100, 'x'.repeat(100)))
    expect(boardToText(board, { maxChars: 500 })).toHaveLength(500)
  })

  it('reads text elements too, not just sticky notes', () => {
    expect(boardToText([{ type: 'text', x: 0, y: 0, text: 'um título' }])).toBe('um título')
  })
})
