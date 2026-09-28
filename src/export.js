// Whiteboard export: SVG string → SVG file / PNG / PDF. Uses the DOM (Image +
// canvas); the engine orchestrates download + notifications. The PDF path
// rasterizes to JPEG and embeds it via the dependency-free pdf.js writer.

import { buildSvg } from './serialize.js'
import { imagePdfBlob } from './pdf.js'

export function boardSvgString(els, opts = {}) {
  return buildSvg(els, opts)
}

export function svgBlob(svgString) {
  return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
}

// Rasterize an SVG string onto a canvas and return a Blob of the given mime.
// `scale` supersamples for crisp output (PNG default 2x).
export function rasterize(
  svgString,
  width,
  height,
  { mime = 'image/png', quality = 0.92, scale = 2, background = null } = {},
) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgBlob(svgString))
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(width * scale))
        canvas.height = Math.max(1, Math.round(height * scale))
        const ctx = canvas.getContext('2d')
        if (background) {
          ctx.fillStyle = background
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve({ blob, width: canvas.width, height: canvas.height })
              : reject(new Error('toBlob failed')),
          mime,
          quality,
        )
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('svg image load failed'))
    }
    img.src = url
  })
}

export async function boardPngBlob(els, opts = {}) {
  const { svg, width, height } = buildSvg(els, opts)
  const { blob } = await rasterize(svg, width, height, {
    mime: 'image/png',
    scale: 2,
    background: '#ffffff',
  })
  return blob
}

export async function boardPdfBlob(els, opts = {}) {
  const { svg, width, height } = buildSvg(els, opts)
  const {
    blob,
    width: cw,
    height: ch,
  } = await rasterize(svg, width, height, {
    mime: 'image/jpeg',
    quality: 0.92,
    scale: 2,
    background: '#ffffff',
  })
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return imagePdfBlob(bytes, cw, ch)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
