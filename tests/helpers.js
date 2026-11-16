import { createCanvas } from "@napi-rs/canvas"
import { buildRepresentation } from "../lib/imageProcessor.js"

export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomColor(rand) {
  return `rgb(${Math.floor(rand() * 256)}, ${Math.floor(rand() * 256)}, ${Math.floor(rand() * 256)})`
}

export function makeScene(seed, width = 640, height = 480) {
  const rand = mulberry32(seed)
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createLinearGradient(0, 0, width * (0.4 + rand() * 0.6), height)
  gradient.addColorStop(0, randomColor(rand))
  gradient.addColorStop(0.5, randomColor(rand))
  gradient.addColorStop(1, randomColor(rand))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  const shapeCount = 22
  for (let i = 0; i < shapeCount; i++) {
    ctx.fillStyle = randomColor(rand)
    const kind = Math.floor(rand() * 3)
    const size = 30 + rand() * 150
    const x = rand() * width
    const y = rand() * height
    ctx.beginPath()
    if (kind === 0) {
      ctx.rect(x, y, size, size * (0.4 + rand()))
    } else if (kind === 1) {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    } else {
      ctx.moveTo(x, y)
      ctx.lineTo(x + size, y + rand() * size)
      ctx.lineTo(x + rand() * size, y + size)
      ctx.closePath()
    }
    ctx.fill()
  }
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = randomColor(rand)
    ctx.lineWidth = 1 + rand() * 4
    ctx.beginPath()
    const x = rand() * width
    const y = rand() * height
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rand() - 0.5) * 120, y + (rand() - 0.5) * 120)
    ctx.stroke()
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = randomColor(rand)
    ctx.beginPath()
    ctx.arc(rand() * width, rand() * height, 3 + rand() * 9, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

export function scaleCanvas(source, width, height) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

export function cropCanvas(source, x, y, width, height) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(source, x, y, width, height, 0, 0, width, height)
  return canvas
}

export function adjustCanvas(source, transform) {
  const canvas = createCanvas(source.width, source.height)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(source, 0, 0)
  const image = ctx.getImageData(0, 0, source.width, source.height)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = transform(data[i], data[i + 1], data[i + 2], i / 4)
    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export function addNoise(source, amplitude, seed) {
  const rand = mulberry32(seed)
  return adjustCanvas(source, (r, g, b) => {
    const n = (rand() - 0.5) * 2 * amplitude
    return [r + n, g + n, b + n]
  })
}

export function shuffleTiles(source, columns, rows, seed) {
  const rand = mulberry32(seed)
  const tileW = Math.floor(source.width / columns)
  const tileH = Math.floor(source.height / rows)
  const order = Array.from({ length: columns * rows }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const canvas = createCanvas(tileW * columns, tileH * rows)
  const ctx = canvas.getContext("2d")
  order.forEach((from, to) => {
    const sx = (from % columns) * tileW
    const sy = Math.floor(from / columns) * tileH
    const dx = (to % columns) * tileW
    const dy = Math.floor(to / columns) * tileH
    ctx.drawImage(source, sx, sy, tileW, tileH, dx, dy, tileW, tileH)
  })
  return canvas
}

export function toRepresentation(canvas, id) {
  const ctx = canvas.getContext("2d")
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return buildRepresentation({ id, name: id, width: canvas.width, height: canvas.height, rgba: image.data })
}

export function regionOverlap(found, expected) {
  const x1 = Math.max(found.x, expected.x)
  const y1 = Math.max(found.y, expected.y)
  const x2 = Math.min(found.x + found.w, expected.x + expected.w)
  const y2 = Math.min(found.y + found.h, expected.y + expected.h)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = found.w * found.h + expected.w * expected.h - inter
  return inter / union
}
