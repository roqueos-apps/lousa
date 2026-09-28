// Element model + factories for the RoqueOS Whiteboard.
// Every element is an axis-aligned bounding box {x,y,w,h} + a rotation `angle`
// (degrees, around the bbox center) + style. Type-specific geometry (freehand
// strokes, line/arrow endpoints) is stored NORMALIZED to [0,1] of the bbox, so
// move = translate x/y, resize = change w/h (points scale for free), rotate =
// the `angle` field (rendered via an SVG rotate transform). Normalized flat
// arrays are also Firestore-safe (no nested arrays). Pure — no Vue/DOM.

let _seq = 0
export function genId() {
  _seq += 1
  // Random suffix so ids never collide within the same millisecond (the lesson
  // from the mobile-grid / desktop-items id-collision bugs).
  return `el_${Date.now().toString(36)}_${_seq}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

export const SHAPE_TYPES = ['rectangle', 'ellipse', 'diamond']
export const FREEHAND_TYPES = ['pencil', 'pen']
export const SEGMENT_TYPES = ['line', 'arrow']

export function defaultStyle(overrides = {}) {
  return {
    stroke: '#1e1e1e',
    strokeWidth: 2,
    fill: null,
    ...overrides,
  }
}

// Creates a fresh element at (x,y) with a zero-size bbox. The drawing handlers
// grow it; `finalizeDraft` clamps + normalizes it.
export function createElement(type, x, y, style = {}) {
  const el = {
    id: genId(),
    type,
    x,
    y,
    w: 0,
    h: 0,
    angle: 0,
    stroke: style.stroke ?? '#1e1e1e',
    strokeWidth: style.strokeWidth ?? 2,
    fill: style.fill ?? null,
    z: 0,
  }
  if (FREEHAND_TYPES.includes(type)) {
    el._raw = [{ x, y }] // absolute points while drawing (stripped on finalize)
    el.points = [] // normalized flat [n0x,n0y,n1x,n1y,...]
  } else if (SEGMENT_TYPES.includes(type)) {
    el.points = [0, 0, 1, 1] // normalized endpoints
  } else if (type === 'text') {
    el.text = ''
    el.fontSize = style.fontSize ?? 24
  } else if (type === 'sticky') {
    el.text = ''
    el.fontSize = style.fontSize ?? 18
    el.bg = style.bg ?? '#ffe27a'
    el.w = style.w ?? 180
    el.h = style.h ?? 180
  } else if (type === 'image') {
    el.src = style.src ?? ''
    // A imagem guardada como anexo do app (a Lousa com conta): só o id, que o sistema troca
    // pelos bytes quando o quadro abre. O `src` fica vazio.
    if (style.anexo) el.anexo = style.anexo
  }
  return el
}

// Push an absolute point onto a freehand draft.
export function pushFreehandPoint(el, x, y) {
  if (el._raw) el._raw.push({ x, y })
}

// Grow a shape/segment draft to the current pointer (signed extents allowed).
export function growDraft(el, x, y) {
  el.w = x - el.x
  el.h = y - el.y
}

// Normalize a finished draft: positive bbox, normalized points, drop _raw.
// Returns false when the element is too small to keep (caller discards it).
export function finalizeDraft(el) {
  if (FREEHAND_TYPES.includes(el.type)) {
    const raw = el._raw || []
    if (raw.length < 2) return false
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const p of raw) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    const w = Math.max(1, maxX - minX)
    const h = Math.max(1, maxY - minY)
    const pts = []
    for (const p of raw) {
      pts.push((p.x - minX) / w, (p.y - minY) / h)
    }
    el.x = minX
    el.y = minY
    el.w = w
    el.h = h
    el.points = pts
    delete el._raw
    return true
  }

  if (SEGMENT_TYPES.includes(el.type)) {
    if (Math.abs(el.w) < 3 && Math.abs(el.h) < 3) return false
    // Encode direction into normalized endpoints, then make bbox positive.
    const nx1 = el.w < 0 ? 1 : 0
    const ny1 = el.h < 0 ? 1 : 0
    el.points = [nx1, ny1, 1 - nx1, 1 - ny1]
    normalizeBox(el)
    return true
  }

  if (SHAPE_TYPES.includes(el.type)) {
    if (Math.abs(el.w) < 3 && Math.abs(el.h) < 3) return false
    normalizeBox(el)
    return true
  }

  return true
}

// Collapse signed width/height into a positive bbox (x,y at top-left).
export function normalizeBox(el) {
  if (el.w < 0) {
    el.x += el.w
    el.w = -el.w
  }
  if (el.h < 0) {
    el.y += el.h
    el.h = -el.h
  }
  el.w = Math.max(1, el.w)
  el.h = Math.max(1, el.h)
}

// --- Rendering helpers (absolute geometry from the normalized model) ----------
export function freehandPathD(el) {
  const p = el.points || []
  if (p.length < 4) return ''
  let d = `M ${el.x + p[0] * el.w} ${el.y + p[1] * el.h}`
  for (let i = 2; i < p.length; i += 2) {
    d += ` L ${el.x + p[i] * el.w} ${el.y + p[i + 1] * el.h}`
  }
  return d
}

export function segmentEnds(el) {
  const [n1x, n1y, n2x, n2y] = el.points || [0, 0, 1, 1]
  return {
    x1: el.x + n1x * el.w,
    y1: el.y + n1y * el.h,
    x2: el.x + n2x * el.w,
    y2: el.y + n2y * el.h,
  }
}

export function diamondPoints(el) {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  const hw = el.w / 2
  const hh = el.h / 2
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
}

export function arrowHeadPoints(el) {
  const { x1, y1, x2, y2 } = segmentEnds(el)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const len = Math.max(10, (el.strokeWidth || 2) * 4)
  const a1 = angle - Math.PI / 6
  const a2 = angle + Math.PI / 6
  return `${x2},${y2} ${x2 - len * Math.cos(a1)},${y2 - len * Math.sin(a1)} ${x2 - len * Math.cos(a2)},${y2 - len * Math.sin(a2)}`
}

export function elementCenter(el) {
  return { cx: el.x + el.w / 2, cy: el.y + el.h / 2 }
}

// SVG transform for an element's rotation (empty when not rotated).
export function rotateTransform(el) {
  if (!el.angle) return null
  const { cx, cy } = elementCenter(el)
  return `rotate(${el.angle} ${cx} ${cy})`
}

// --- Legacy .rosboard / old in-memory format migration ------------------------
// Old elements used signed {x,y,width,height}, absolute points[], `strokeColor`,
// `path`, `fontSize`. Convert to the new normalized model.
export function migrateElement(old) {
  if (!old || typeof old !== 'object') return null
  if (old.w !== undefined && old.angle !== undefined && old._raw === undefined) {
    return old // already new-model
  }
  const type = old.type
  const stroke = old.strokeColor || old.stroke || '#1e1e1e'
  const base = {
    id: old.id ? String(old.id) : genId(),
    type,
    angle: old.angle || 0,
    stroke,
    strokeWidth: old.strokeWidth || 2,
    fill: old.fill || null,
    z: old.z || 0,
  }
  if (FREEHAND_TYPES.includes(type) && Array.isArray(old.points)) {
    const draft = {
      ...base,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      _raw: old.points.map((p) => ({ x: p.x, y: p.y })),
    }
    finalizeDraft(draft)
    return draft
  }
  if (SEGMENT_TYPES.includes(type)) {
    const el = { ...base, x: old.x, y: old.y, w: old.width || 1, h: old.height || 1 }
    el.points = [
      old.width < 0 ? 1 : 0,
      old.height < 0 ? 1 : 0,
      old.width < 0 ? 0 : 1,
      old.height < 0 ? 0 : 1,
    ]
    normalizeBox(el)
    return el
  }
  if (type === 'text') {
    return {
      ...base,
      x: old.x,
      y: old.y,
      w: old.w || 1,
      h: old.h || old.fontSize || 20,
      text: old.text || '',
      fontSize: old.fontSize || 20,
    }
  }
  // shapes
  const el = { ...base, x: old.x, y: old.y, w: old.width || 1, h: old.height || 1 }
  normalizeBox(el)
  return el
}

/**
 * The board, as text an agent can read.
 *
 * A whiteboard is spatial, not linear: the meaning lives in where things sit.
 * We approximate reading order by banding the board into rows (elements within
 * `rowTolerance` of each other are the same row) and sorting left to right
 * inside each row, which is how a person scans a wall of sticky notes.
 *
 * Only the elements that CARRY words are included. Shapes and strokes have no
 * text, and listing them as "rectangle" would be noise the model has to ignore.
 * Returns '' for a board with nothing written on it, so the caller reports
 * "nothing to work on" instead of sending an empty prompt.
 */
export function boardToText(elements, { maxChars = 12000, rowTolerance = 60 } = {}) {
  const written = (Array.isArray(elements) ? elements : [])
    .filter((el) => typeof el?.text === 'string' && el.text.trim())
    .map((el) => ({ x: Number(el.x) || 0, y: Number(el.y) || 0, text: el.text.trim() }))

  if (!written.length) return ''

  written.sort((a, b) => a.y - b.y || a.x - b.x)

  const rows = []
  for (const item of written) {
    const row = rows.find((r) => Math.abs(r.y - item.y) <= rowTolerance)
    if (row) row.items.push(item)
    else rows.push({ y: item.y, items: [item] })
  }

  const lines = rows.map((row) =>
    row.items
      .sort((a, b) => a.x - b.x)
      .map((i) => i.text.replace(/\s+/g, ' '))
      .join(' | '),
  )

  return lines.join('\n').slice(0, maxChars)
}
