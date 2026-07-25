// Generate PWA icons as PNG using pure Node.js (no external deps)
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  let c = 0xffffffff
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let v = n
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1
    table[n] = v
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // color type (RGB)
  ihdrData[10] = 0  // compression
  ihdrData[11] = 0  // filter
  ihdrData[12] = 0  // interlace
  const ihdrType = Buffer.from('IHDR')
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]))
  const ihdr = Buffer.alloc(25)
  ihdr.writeUInt32BE(13, 0)
  ihdrType.copy(ihdr, 4)
  ihdrData.copy(ihdr, 8)
  ihdr.writeUInt32BE(ihdrCrc, 21)

  // Image data - purple background with "DK" text drawn as pixels
  const rawData = Buffer.alloc(height * (1 + width * 3))

  // Draw circle background + DK text
  const centerX = width / 2
  const centerY = height / 2
  const radius = width * 0.42

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3)
    rawData[rowStart] = 0 // filter: none

    for (let x = 0; x < width; x++) {
      const dx = x - centerX
      const dy = y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)

      const pixelOffset = rowStart + 1 + x * 3

      if (dist <= radius) {
        // Inside circle - gradient purple
        const t = dist / radius
        const cr = Math.round(99 + (79 - 99) * t)   // #6366f1 -> #4f46e5
        const cg = Math.round(102 + (70 - 102) * t)
        const cb = Math.round(241 + (229 - 241) * t)
        rawData[pixelOffset] = cr
        rawData[pixelOffset + 1] = cg
        rawData[pixelOffset + 2] = cb

        // Draw "DK" text in white
        const textX = (x - centerX) / radius
        const textY = (y - centerY) / radius

        // D letter (left side)
        const inD = (
          (textX > -0.38 && textX < -0.05 && Math.abs(textY) < 0.3) || // vertical bar
          (textX >= -0.38 && textX <= -0.15 && Math.abs(textY + 0.28) < 0.05) || // bottom curve approximation
          (textX >= -0.38 && textX <= -0.15 && Math.abs(textY - 0.28) < 0.05) || // top curve
          (textX > -0.25 && textX < -0.05 && Math.abs(textY) < 0.3 && Math.abs(textX + 0.25) * 3 + Math.abs(textY) > 0.5) // curve
        )

        // K letter (right side)
        const inK = (
          (textX > 0.05 && textX < 0.12 && Math.abs(textY) < 0.3) || // vertical bar
          (textX >= 0.12 && textX <= 0.35 && Math.abs(textY - (0.3 - (textX - 0.12) * 1.3)) < 0.06) || // upper diagonal
          (textX >= 0.12 && textX <= 0.35 && Math.abs(textY + (0.3 - (textX - 0.12) * 1.3)) < 0.06) // lower diagonal
        )

        if (inD || inK) {
          rawData[pixelOffset] = 255
          rawData[pixelOffset + 1] = 255
          rawData[pixelOffset + 2] = 255
        }
      } else {
        // Outside circle - transparent (black with 0 alpha will be handled by RGBA)
        // But we're RGB, so just use background color
        rawData[pixelOffset] = 15
        rawData[pixelOffset + 1] = 23
        rawData[pixelOffset + 2] = 42
      }
    }
  }

  const compressed = zlib.deflateSync(rawData)

  const idatType = Buffer.from('IDAT')
  const idatCrc = crc32(Buffer.concat([idatType, compressed]))
  const idat = Buffer.alloc(12 + compressed.length)
  idat.writeUInt32BE(compressed.length, 0)
  idatType.copy(idat, 4)
  compressed.copy(idat, 8)
  idat.writeUInt32BE(idatCrc, 8 + compressed.length)

  // IEND
  const iendType = Buffer.from('IEND')
  const iendCrc = crc32(iendType)
  const iend = Buffer.alloc(12)
  iend.writeUInt32BE(0, 0)
  iendType.copy(iend, 4)
  iend.writeUInt32BE(iendCrc, 8)

  return Buffer.concat([signature, ihdr, idat, iend])
}

const publicDir = path.join(__dirname, 'frontend', 'public')
const iconsDir = path.join(publicDir, 'icons')
fs.mkdirSync(iconsDir, { recursive: true })

const sizes = [72, 96, 120, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  const png = createPNG(size, size, 99, 102, 241)
  const filePath = path.join(iconsDir, `icon-${size}.png`)
  fs.writeFileSync(filePath, png)
  console.log(`Created icon-${size}.png (${png.length} bytes)`)
}

console.log('\nAll icons generated!')
