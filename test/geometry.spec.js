import { describe, it, expect } from 'vitest'
import {
  rotatePoint,
  selectionBounds,
  handlePositions,
  hitTestElements,
  elementsInBox,
  applyMove,
  applyResize,
  applyRotate,
  contentBounds,
} from '../src/geometry.js'

const rect = (over = {}) => ({
  id: 'r',
  type: 'rectangle',
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  angle: 0,
  stroke: '#000',
  strokeWidth: 2,
  ...over,
})

describe('whiteboard/geometry', () => {
  it('rotatePoint rotates around a pivot', () => {
    const p = rotatePoint(1, 0, 0, 0, 90)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(1, 6)
  })

  it('selectionBounds — single element keeps its bbox + angle', () => {
    const b = selectionBounds([rect({ x: 10, y: 20, angle: 30 })])
    expect(b).toMatchObject({ x: 10, y: 20, w: 100, h: 100, angle: 30, single: true })
  })

  it('selectionBounds — multiple elements is an axis-aligned union', () => {
    const b = selectionBounds([rect({ x: 0, y: 0 }), rect({ id: 'r2', x: 200, y: 50 })])
    expect(b.single).toBe(false)
    expect(b.x).toBe(0)
    expect(b.y).toBe(0)
    expect(b.w).toBe(300)
    expect(b.h).toBe(150)
  })

  it('handlePositions returns 8 resize handles + a rotate handle', () => {
    const hs = handlePositions(selectionBounds([rect()]))
    const names = hs.map((h) => h.name)
    expect(hs).toHaveLength(9)
    expect(names).toEqual(
      expect.arrayContaining(['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w', 'rotate']),
    )
  })

  it('hitTestElements finds the topmost element under a point', () => {
    const els = [rect(), rect({ id: 'top', x: 40, y: 40, w: 100, h: 100 })]
    expect(hitTestElements({ x: 60, y: 60 }, els).id).toBe('top')
    expect(hitTestElements({ x: 5, y: 5 }, els).id).toBe('r')
    expect(hitTestElements({ x: 500, y: 500 }, els)).toBeNull()
  })

  it('elementsInBox returns fully-contained elements', () => {
    const els = [
      rect({ x: 10, y: 10, w: 20, h: 20 }),
      rect({ id: 'out', x: 400, y: 400, w: 20, h: 20 }),
    ]
    const inside = elementsInBox({ x: 0, y: 0, w: 100, h: 100 }, els)
    expect(inside.map((e) => e.id)).toEqual(['r'])
  })

  it('applyMove translates the element', () => {
    const el = rect()
    applyMove(el, 15, -5)
    expect(el.x).toBe(15)
    expect(el.y).toBe(-5)
  })

  it('applyResize from the SE handle grows w/h, keeping the NW corner fixed', () => {
    const el = rect()
    applyResize(el, 'se', 10, 20)
    expect(el.w).toBeCloseTo(110, 4)
    expect(el.h).toBeCloseTo(120, 4)
    expect(el.x).toBeCloseTo(0, 4)
    expect(el.y).toBeCloseTo(0, 4)
  })

  it('applyResize from the NW handle keeps the SE corner fixed', () => {
    const el = rect()
    applyResize(el, 'nw', 10, 10)
    expect(el.w).toBeCloseTo(90, 4)
    expect(el.h).toBeCloseTo(90, 4)
    expect(el.x).toBeCloseTo(10, 4)
    expect(el.y).toBeCloseTo(10, 4)
  })

  it('applyRotate sets angle from a pointer position (right of center → 90°)', () => {
    const el = rect() // center (50,50)
    applyRotate(el, { x: 150, y: 50 })
    expect(el.angle).toBeCloseTo(90, 4)
  })

  it('contentBounds spans all elements with padding', () => {
    const b = contentBounds([rect({ x: 0, y: 0 }), rect({ id: 'r2', x: 100, y: 100 })], 10)
    expect(b.x).toBe(-10)
    expect(b.y).toBe(-10)
    expect(b.w).toBe(220)
    expect(b.h).toBe(220)
  })
})
