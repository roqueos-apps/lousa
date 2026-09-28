// Minimal single-page PDF writer that embeds a JPEG (DCTDecode) — no dependency
// (the project ships no PDF library). The page is sized 1pt:1px to the image, so
// there's no scaling distortion. Byte-accurate xref offsets. Pure.

function strBytes(s) {
  return new TextEncoder().encode(s)
}

// Assemble the PDF as a Uint8Array embedding `jpegBytes` (a Uint8Array) at the
// given pixel dimensions.
export function imagePdfBytes(jpegBytes, iw, ih) {
  const parts = []
  let offset = 0
  const offsets = []
  const push = (bytes) => {
    parts.push(bytes)
    offset += bytes.length
  }
  const pushStr = (s) => push(strBytes(s))
  const mark = (n) => {
    offsets[n] = offset
  }

  pushStr('%PDF-1.4\n')

  mark(1)
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  mark(2)
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  mark(3)
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${iw} ${ih}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  )

  mark(4)
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${iw} /Height ${ih} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  )
  push(jpegBytes)
  pushStr('\nendstream\nendobj\n')

  // Content stream: scale the unit image to the full page (PDF y is bottom-up;
  // the image fills the MediaBox).
  const content = `q ${iw} 0 0 ${ih} 0 0 cm /Im0 Do Q`
  mark(5)
  pushStr(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

  const xrefOffset = offset
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  pushStr(xref)
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

export function imagePdfBlob(jpegBytes, iw, ih) {
  return new Blob([imagePdfBytes(jpegBytes, iw, ih)], { type: 'application/pdf' })
}
