export function cantor(x, y) {
  return ((x + y) * (x + y + 1)) / 2 + y
}

export function cantorReverse(z) {
  const w = Math.floor((Math.sqrt(8 * z + 1) - 1) / 2)
  const t = (w * (w + 1)) / 2
  const y = z - t
  const x = w - y

  return [x, y]
}

export function integerSqrtBig(n) {
  if (n < 0n) {
    throw new RangeError("integerSqrtBig attend un entier positif")
  }
  if (n < 2n) {
    return n
  }
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2))
  for (;;) {
    const y = (x + n / x) >> 1n
    if (y >= x) {
      return x
    }
    x = y
  }
}

export function cantorBig(x, y) {
  const a = BigInt(x)
  const b = BigInt(y)
  if (a < 0n || b < 0n) {
    throw new RangeError("cantorBig attend des entiers positifs")
  }
  return ((a + b) * (a + b + 1n)) / 2n + b
}

export function cantorReverseBig(z) {
  const n = BigInt(z)
  if (n < 0n) {
    throw new RangeError("cantorReverseBig attend un entier positif")
  }
  const w = (integerSqrtBig(8n * n + 1n) - 1n) / 2n
  const t = (w * (w + 1n)) / 2n
  const y = n - t
  const x = w - y

  return [x, y]
}

export const MAX_SAFE_COMPONENT = 255
export const MAX_ENCODED_PIXEL = cantor(cantor(255, 255), 255)

export function encodePixel(r, g, b) {
  const firstPair = cantor(r, g)
  return cantor(firstPair, b)
}

export function decodePixel(encodedPixel) {
  const [firstPair, b] = cantorReverse(encodedPixel)
  const [r, g] = cantorReverse(firstPair)

  return [r, g, b]
}

export function encodePixelBig(r, g, b) {
  return cantorBig(cantorBig(r, g), b)
}

export function decodePixelBig(encodedPixel) {
  const [firstPair, b] = cantorReverseBig(encodedPixel)
  const [r, g] = cantorReverseBig(firstPair)

  return [Number(r), Number(g), Number(b)]
}

export function isValidChannel(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_SAFE_COMPONENT
}

export function encodeRgbBuffer(rgb, pixelCount) {
  const encoded = new Float64Array(pixelCount)
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 3
    encoded[i] = encodePixel(rgb[o], rgb[o + 1], rgb[o + 2])
  }
  return encoded
}

export function decodeToPlanes(encoded) {
  const count = encoded.length
  const r = new Float32Array(count)
  const g = new Float32Array(count)
  const b = new Float32Array(count)
  const gray = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const [first, bv] = cantorReverse(encoded[i])
    const [rv, gv] = cantorReverse(first)
    r[i] = rv
    g[i] = gv
    b[i] = bv
    gray[i] = 0.299 * rv + 0.587 * gv + 0.114 * bv
  }
  return { r, g, b, gray }
}
