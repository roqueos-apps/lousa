// Board → SVG string (only the content bounds, not the infinite viewport).
// Pure string building so it's unit-testable without a DOM. Mirrors the element
// rendering in ROSWhiteboard's template.

import {
  freehandPathD,
  segmentEnds,
  diamondPoints,
  arrowHeadPoints,
  rotateTransform,
} from './elements.js'
import { contentBounds } from './geometry.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function shapeBody(el) {
  const stroke = el.stroke || '#1e1e1e'
  const sw = el.strokeWidth || 2
  const fill = el.fill || 'none'
  switch (el.type) {
    case 'rectangle':
      return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}" rx="2"/>`
    case 'ellipse':
      return `<ellipse cx="${el.x + el.w / 2}" cy="${el.y + el.h / 2}" rx="${el.w / 2}" ry="${el.h / 2}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`
    case 'diamond':
      return `<polygon points="${diamondPoints(el)}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`
    case 'line': {
      const e = segmentEnds(el)
      return `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`
    }
    case 'arrow': {
      const e = segmentEnds(el)
      return (
        `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>` +
        `<polygon points="${arrowHeadPoints(el)}" fill="${stroke}"/>`
      )
    }
    case 'pencil':
    case 'pen':
      return `<path d="${freehandPathD(el)}" stroke="${stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    case 'text':
      return `<text x="${el.x}" y="${el.y + (el.fontSize || 20)}" fill="${stroke}" font-size="${el.fontSize || 20}" font-family="sans-serif">${escapeXml(el.text)}</text>`
    case 'sticky': {
      const bg = el.bg || '#ffe27a'
      const fs = el.fontSize || 18
      return (
        `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${bg}" rx="6"/>` +
        `<text x="${el.x + 10}" y="${el.y + fs + 8}" fill="#1e1e1e" font-size="${fs}" font-family="sans-serif">${escapeXml(el.text)}</text>`
      )
    }
    case 'image':
      return el.src
        ? `<image x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" href="${escapeXml(el.src)}" preserveAspectRatio="none"/>`
        : ''
    default:
      return ''
  }
}

export function elementToSvg(el) {
  const body = shapeBody(el)
  if (!body) return ''
  const t = rotateTransform(el)
  return t ? `<g transform="${t}">${body}</g>` : body
}

// Build a standalone SVG document string covering the content bounds.
export function buildSvg(els, { pad = 24, background = '#ffffff' } = {}) {
  const list = els || []
  const b = contentBounds(list, pad) || { x: 0, y: 0, w: 800, h: 600 }
  const w = Math.max(1, Math.round(b.w))
  const h = Math.max(1, Math.round(b.h))
  const bgRect = background
    ? `<rect x="${b.x}" y="${b.y}" width="${w}" height="${h}" fill="${background}"/>`
    : ''
  const inner = list.map(elementToSvg).join('')
  const svg =
    `<svg xmlns="${SVG_NS}" width="${w}" height="${h}" viewBox="${b.x} ${b.y} ${w} ${h}">` +
    bgRect +
    inner +
    `</svg>`
  return { svg, width: w, height: h, bounds: b }
}
