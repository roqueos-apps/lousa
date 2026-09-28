import { describe, it, expect } from 'vitest'
import { buildSvg, escapeXml, elementToSvg } from '../src/serialize.js'

describe('whiteboard/serialize', () => {
  it('escapeXml escapes markup characters', () => {
    expect(escapeXml('<a> & "b"')).toBe('&lt;a&gt; &amp; &quot;b&quot;')
  })

  it('buildSvg wraps content in an SVG with a viewBox covering the bounds', () => {
    const els = [
      {
        id: 'r',
        type: 'rectangle',
        x: 0,
        y: 0,
        w: 100,
        h: 80,
        angle: 0,
        stroke: '#000',
        strokeWidth: 2,
      },
    ]
    const { svg, width, height } = buildSvg(els, { pad: 0 })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('<rect')
    expect(svg).toContain('viewBox="0 0 100 80"')
    expect(width).toBe(100)
    expect(height).toBe(80)
  })

  it('renders rotated elements inside a rotate group', () => {
    const out = elementToSvg({
      type: 'rectangle',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      angle: 45,
      stroke: '#000',
      strokeWidth: 1,
    })
    expect(out).toContain('rotate(45')
  })

  it('escapes text element content', () => {
    const out = elementToSvg({
      type: 'text',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      angle: 0,
      text: '<b>',
      stroke: '#000',
      fontSize: 20,
    })
    expect(out).toContain('&lt;b&gt;')
  })
})
