/**
 * VEX TM RPi Simulator
 *
 * Starts N HTTP servers on consecutive ports (default: 16 servers on 4001–4016).
 * Each server responds to GET /screen.png with a dynamically generated PNG showing:
 *   - A distinct background color per slot
 *   - The slot number and port
 *   - An incrementing frame counter
 *   - A moving progress bar
 *
 * Usage:
 *   node scripts/sim.js              # start 16 simulators
 *   node scripts/sim.js 4            # start 4 simulators
 *   node scripts/sim.js --help
 *
 * Configure the app by pointing cells at localhost:4001, localhost:4002, etc.
 */

'use strict'

const http = require('http')
const { PNG } = require('pngjs')

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_PORT = 4001
const IMG_W = 640
const IMG_H = 400

const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log([
    'Usage: node scripts/sim.js [count]',
    '',
    '  count   Number of RPi simulators to start (default: 16, max: 16)',
    '',
    'Each simulator listens on localhost:<BASE_PORT + index>.',
    `Default ports: ${BASE_PORT}–${BASE_PORT + 15}`,
    '',
    'Configure cells in the app as:',
    '  localhost:4001  localhost:4002  ... localhost:4016',
  ].join('\n'))
  process.exit(0)
}

const countArg = args.find(a => /^\d+$/.test(a))
const NUM = Math.min(16, Math.max(1, countArg ? parseInt(countArg, 10) : 16))

// ── 5×7 Bitmap Font ───────────────────────────────────────────────────────────
// Each glyph: 7 rows of 5 bits. Bit 4 = leftmost pixel.

const GLYPHS = {
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  ':': [0b00000, 0b00100, 0b00100, 0b00000, 0b00100, 0b00100, 0b00000],
  '0': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b10001, 0b01110],
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  'M': [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
}

const GLYPH_W = 5
const GLYPH_H = 7

/** Draw a single character onto a PNG at pixel (x, y) with given scale and color. */
function drawChar(png, ch, x, y, r, g, b, scale) {
  const rows = GLYPHS[ch.toUpperCase()] || GLYPHS[' ']
  for (let row = 0; row < GLYPH_H; row++) {
    for (let col = 0; col < GLYPH_W; col++) {
      if (rows[row] & (1 << (GLYPH_W - 1 - col))) {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = x + col * scale + sx
            const py = y + row * scale + sy
            if (px >= 0 && px < IMG_W && py >= 0 && py < IMG_H) {
              const idx = (py * IMG_W + px) * 4
              png.data[idx]     = r
              png.data[idx + 1] = g
              png.data[idx + 2] = b
              png.data[idx + 3] = 255
            }
          }
        }
      }
    }
  }
}

/** Draw a string onto a PNG. Returns the x position after the last character. */
function drawText(png, text, x, y, r, g, b, scale) {
  let cx = x
  for (const ch of text.toUpperCase()) {
    drawChar(png, ch, cx, y, r, g, b, scale)
    cx += (GLYPH_W + 1) * scale
  }
  return cx
}

// ── Color generation ──────────────────────────────────────────────────────────

/** HSV → RGB, all values 0–1 in, 0–255 out. */
function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r, g, b
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// Pre-compute distinct background colors — evenly spaced hues, dark saturation
const BG_COLORS = Array.from({ length: 16 }, (_, i) =>
  hsvToRgb(i / 16, 0.65, 0.22)
)

// ── Frame generation ──────────────────────────────────────────────────────────

const frameCounters = new Array(16).fill(0)

function generateFrame(index) {
  const [bgR, bgG, bgB] = BG_COLORS[index]
  const frame = frameCounters[index]++
  const port = BASE_PORT + index
  const slotNum = index + 1

  const png = new PNG({ width: IMG_W, height: IMG_H, filterType: -1 })

  // Fill background
  const bg32 = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR // little-endian RGBA
  const u32 = new Uint32Array(png.data.buffer)
  u32.fill(bg32)

  // Slightly lighter center panel
  const panelR = Math.min(255, bgR + 20)
  const panelG = Math.min(255, bgG + 20)
  const panelB = Math.min(255, bgB + 20)
  const panel32 = (255 << 24) | (panelB << 16) | (panelG << 8) | panelR
  for (let y = 30; y < IMG_H - 30; y++) {
    for (let x = 30; x < IMG_W - 30; x++) {
      u32[y * IMG_W + x] = panel32
    }
  }

  // "RPI N" — large label
  drawText(png, `RPI ${slotNum}`, 50, 55, 255, 255, 255, 7)

  // Frame counter
  drawText(png, `FRAME  ${frame}`, 50, 175, 210, 210, 210, 4)

  // Port info
  drawText(png, `PORT  ${port}`, 50, 265, 140, 140, 160, 3)

  // Moving progress bar at the bottom
  const barW = 60
  const barTrack = IMG_W - 60 - barW
  const barX = 30 + Math.round((frame % 60) / 59 * barTrack)
  const barY = IMG_H - 35
  const [acR, acG, acB] = hsvToRgb(index / 16, 0.4, 1.0) // bright accent
  for (let y = barY; y < barY + 14; y++) {
    for (let x = barX; x < barX + barW; x++) {
      const idx = (y * IMG_W + x) * 4
      png.data[idx]     = acR
      png.data[idx + 1] = acG
      png.data[idx + 2] = acB
      png.data[idx + 3] = 255
    }
  }

  return PNG.sync.write(png)
}

// ── HTTP servers ──────────────────────────────────────────────────────────────

let started = 0

for (let i = 0; i < NUM; i++) {
  const port = BASE_PORT + i
  const index = i

  http.createServer((req, res) => {
    const path = req.url.split('?')[0]
    if (path === '/screen.png') {
      let body
      try {
        body = generateFrame(index)
      } catch (err) {
        res.writeHead(500)
        res.end('PNG generation error: ' + err.message)
        return
      }
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(body)
    } else {
      res.writeHead(404)
      res.end()
    }
  }).listen(port, '0.0.0.0', () => {
    console.log(`  RPi ${String(index + 1).padStart(2)}  →  localhost:${port}`)
    started++
    if (started === NUM) {
      console.log(`\nAll ${NUM} simulator(s) running. Press Ctrl+C to stop.`)
      console.log('\nConfigure cells in the app using the addresses above.')
    }
  }).on('error', err => {
    console.error(`Failed to start simulator on port ${port}: ${err.message}`)
  })
}

console.log(`\nStarting ${NUM} RPi simulator(s) on ports ${BASE_PORT}–${BASE_PORT + NUM - 1}...\n`)
