import { describe, it, expect } from 'vitest'
import { imagePdfBytes } from '../src/pdf.js'

describe('whiteboard/pdf', () => {
  it('builds a valid single-page PDF embedding a JPEG', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9])
    const bytes = imagePdfBytes(jpeg, 100, 80)
    const text = new TextDecoder('latin1').decode(bytes)

    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('/Filter /DCTDecode')
    expect(text).toContain('/MediaBox [0 0 100 80]')
    expect(text).toContain('/Width 100')
    expect(text).toContain('/Height 80')
    expect(text).toContain('xref')
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
    // the JPEG SOI/EOI markers survive inside the stream
    expect(text).toContain('\xff\xd8')
  })
})
