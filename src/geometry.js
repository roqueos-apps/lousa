// Pure geometry for the RoqueOS Whiteboard interaction layer: selection bounds,
// resize/rotate handles, hit-testing (rotation-aware), and the move/resize/rotate
// mutators. World coordinates only (the engine maps screen↔world via pan/zoom).
// No Vue/DOM — exhaustively unit-testable with exact numbers.

import {
  freehandPathD,
  segmentEnds,
  FREEHAND_TYPES,
  SEGMENT_TYPES,
  elementCenter,
} from './elements.js'

const DEG = Math.PI / 180

export function rotatePoint(px, py, cx, cy, deg) {
  if (!deg) return { x: px, y: py }
  const r = deg * DEG
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const dx = px - cx
  const dy = py - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

// Rotate a free vector (no pivot translation).
function rotateVec(dx, dy, deg) {
  if (!deg) return { x: dx, y: dy }
  const r = deg * DEG
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
}

// The four corners of an element's bbox in WORLD space (after its rotation).
export function elementCorners(el) {
  const { cx, cy } = elementCenter(el)
  const c = [
    [el.x, el.y],
    [el.x + el.w, el.y],
    [el.x + el.w, el.y + el.h],
    [el.x, el.y + el.h],
  ]
  return c.map(([x, y]) => rotatePoint(x, y, cx, cy, el.angle))
}

// Selection bounds. One element → its own bbox + angle (handles rotate with it).
// Multiple → axis-aligned union of rotated corners (angle 0; group move only).
export function selectionBounds(els) {
  if (!els || els.length === 0) return null
  if (els.length === 1) {
    const e = els[0]
    return { x: e.x, y: e.y, w: e.w, h: e.h, angle: e.angle || 0, single: true }
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const el of els) {
    for (const p of elementCorners(el)) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, angle: 0, single: false }
}

// 8 resize handles + 1 rotate handle, in LOCAL (unrotated) bbox coordinates.
// The selection layer applies the bounds rotation; hit-testing inverse-rotates.
const HANDLE_DEFS = [
  ['nw', 0, 0],
  ['n', 0.5, 0],
  ['ne', 1, 0],
  ['e', 1, 0.5],
  ['se', 1, 1],
  ['s', 0.5, 1],
  ['sw', 0, 1],
  ['w', 0, 0.5],
]

export function handlePositions(bounds, rotateGap = 28) {
  if (!bounds) return []
  const out = HANDLE_DEFS.map(([name, nx, ny]) => ({
    name,
    x: bounds.x + nx * bounds.w,
    y: bounds.y + ny * bounds.h,
  }))
  out.push({ name: 'rotate', x: bounds.x + bounds.w / 2, y: bounds.y - rotateGap })
  return out
}

// Which handle (if any) is under a world point. Inverse-rotates the point into
// the bbox's local frame first.
export function hitTestHandle(point, bounds, tol = 10) {
  if (!bounds || !bounds.single) return null
  const cx = bounds.x + bounds.w / 2
  const cy = bounds.y + bounds.h / 2
  const local = rotatePoint(point.x, point.y, cx, cy, -(bounds.angle || 0))
  for (const h of handlePositions(bounds)) {
    if (Math.abs(local.x - h.x) <= tol && Math.abs(local.y - h.y) <= tol) return h.name
  }
  return null
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

// Is a world point on/inside an element? Rotation-aware.
export function pointInElement(point, el, tolerance = 8) {
  const { cx, cy } = elementCenter(el)
  const p = rotatePoint(point.x, point.y, cx, cy, -(el.angle || 0))
  const tol = tolerance + (el.strokeWidth || 2)

  if (FREEHAND_TYPES.includes(el.type)) {
    const pts = el.points || []
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = el.x + pts[i] * el.w
      const y1 = el.y + pts[i + 1] * el.h
      const x2 = el.x + pts[i + 2] * el.w
      const y2 = el.y + pts[i + 3] * el.h
      if (distToSegment(p.x, p.y, x1, y1, x2, y2) <= tol) return true
    }
    return false
  }
  if (SEGMENT_TYPES.includes(el.type)) {
    const e = segmentEnds(el)
    return distToSegment(p.x, p.y, e.x1, e.y1, e.x2, e.y2) <= tol
  }
  // shapes / text / sticky / image: bbox test
  return (
    p.x >= el.x - tol && p.x <= el.x + el.w + tol && p.y >= el.y - tol && p.y <= el.y + el.h + tol
  )
}

// Topmost element hit (elements are bottom→top; iterate from the end).
export function hitTestElements(point, els, tolerance = 8) {
  for (let i = els.length - 1; i >= 0; i--) {
    if (pointInElement(point, els[i], tolerance)) return els[i]
  }
  return null
}

// Elements fully inside a world-space box (drag-select).
export function elementsInBox(box, els) {
  const minX = Math.min(box.x, box.x + box.w)
  const maxX = Math.max(box.x, box.x + box.w)
  const minY = Math.min(box.y, box.y + box.h)
  const maxY = Math.max(box.y, box.y + box.h)
  return els.filter((el) => {
    const corners = elementCorners(el)
    return corners.every((c) => c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY)
  })
}

// --- Mutators (mutate the element in place) -----------------------------------
export function applyMove(el, dx, dy) {
  el.x += dx
  el.y += dy
}

// Resize by dragging `handle` by a WORLD delta (dx,dy), keeping the opposite
// corner/edge fixed in world space (works for any rotation angle).
const FIXED_FOR = {
  se: [0, 0],
  sw: [1, 0],
  ne: [0, 1],
  nw: [1, 1],
  e: [0, 0.5],
  w: [1, 0.5],
  s: [0.5, 0],
  n: [0.5, 1],
}

export function applyResize(el, handle, dx, dy, minSize = 8) {
  const fixed = FIXED_FOR[handle]
  if (!fixed) return
  const angle = el.angle || 0
  const { cx, cy } = elementCenter(el)

  // World position of the fixed corner BEFORE resize.
  const fLocalX = el.x + fixed[0] * el.w
  const fLocalY = el.y + fixed[1] * el.h
  const fWorld = rotatePoint(fLocalX, fLocalY, cx, cy, angle)

  // Convert the world drag delta into the element's local frame.
  const ld = rotateVec(dx, dy, -angle)

  let newW = el.w
  let newH = el.h
  if (handle.includes('e')) newW = el.w + ld.x
  if (handle.includes('w')) newW = el.w - ld.x
  if (handle.includes('s')) newH = el.h + ld.y
  if (handle.includes('n')) newH = el.h - ld.y
  newW = Math.max(minSize, newW)
  newH = Math.max(minSize, newH)

  // Place the new box so the fixed corner stays at fWorld.
  const offX = (fixed[0] - 0.5) * newW
  const offY = (fixed[1] - 0.5) * newH
  const ro = rotateVec(offX, offY, angle)
  const newCx = fWorld.x - ro.x
  const newCy = fWorld.y - ro.y
  el.w = newW
  el.h = newH
  el.x = newCx - newW / 2
  el.y = newCy - newH / 2
}

// Set rotation from a pointer world position (the rotate handle sits above the
// top edge, so pointer directly above center → angle 0). Optional snap.
export function applyRotate(el, pointer, snap = 0) {
  const { cx, cy } = elementCenter(el)
  let deg = (Math.atan2(pointer.y - cy, pointer.x - cx) / DEG + 90) % 360
  if (deg < 0) deg += 360
  if (snap > 0) deg = Math.round(deg / snap) * snap
  el.angle = deg
}

// Axis-aligned content bounds of all elements (for fit-to-content / export).
export function contentBounds(els, pad = 0) {
  if (!els || els.length === 0) return null
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const el of els) {
    for (const p of elementCorners(el)) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
  }
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
}

export { freehandPathD }
