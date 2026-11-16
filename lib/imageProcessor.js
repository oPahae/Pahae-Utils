import { encodeRgbBuffer, decodeToPlanes, cantor } from "./cantor.js"

export const ALLOWED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/bmp": [".bmp"]
}

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const MAX_PDF_BYTES = 12 * 1024 * 1024
export const LEVEL_SIZES = [80, 160, 320]
export const HISTOGRAM_STEP = 32

export function sanitizeFileName(name) {
  const base = String(name || "fichier").split(/[\\/]/).pop()
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
  const limited = cleaned.length > 120 ? cleaned.slice(0, 120) : cleaned
  return limited || "fichier"
}

export function detectImageSignature(bytes) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png"
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif"
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp"
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp"
  }
  return null
}

export function detectPdfSignature(bytes) {
  const limit = Math.min(bytes.length - 4, 1024)
  for (let i = 0; i <= limit; i++) {
    if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46 && bytes[i + 4] === 0x2d) {
      return true
    }
  }
  return false
}

export function extensionOf(name) {
  const match = /\.[A-Za-z0-9]+$/.exec(String(name || ""))
  return match ? match[0].toLowerCase() : ""
}

export async function validateImageFile(file) {
  const name = sanitizeFileName(file.name)
  const extension = extensionOf(name)
  const allowedExtensions = Object.values(ALLOWED_IMAGE_TYPES).flat()
  if (!allowedExtensions.includes(extension)) {
    return { ok: false, error: `${name} : extension non prise en charge (PNG, JPEG, WebP, GIF, BMP).` }
  }
  if (file.type && !ALLOWED_IMAGE_TYPES[file.type]) {
    return { ok: false, error: `${name} : type de fichier non pris en charge (${file.type}).` }
  }
  if (file.size === 0) {
    return { ok: false, error: `${name} : le fichier est vide.` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `${name} : le fichier dépasse ${Math.round(MAX_IMAGE_BYTES / 1048576)} Mo.` }
  }
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const detected = detectImageSignature(header)
  if (!detected) {
    return { ok: false, error: `${name} : le contenu ne correspond à aucun format d'image reconnu.` }
  }
  if (!ALLOWED_IMAGE_TYPES[detected].includes(extension)) {
    return { ok: false, error: `${name} : l'extension ne correspond pas au contenu réel du fichier.` }
  }
  return { ok: true, name, detectedType: detected }
}

export async function validatePdfFile(file) {
  const name = sanitizeFileName(file.name)
  if (extensionOf(name) !== ".pdf") {
    return { ok: false, error: `${name} : seuls les fichiers .pdf sont acceptés.` }
  }
  if (file.type && file.type !== "application/pdf") {
    return { ok: false, error: `${name} : type de fichier non pris en charge (${file.type}).` }
  }
  if (file.size === 0) {
    return { ok: false, error: `${name} : le fichier est vide.` }
  }
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, error: `${name} : le fichier dépasse ${Math.round(MAX_PDF_BYTES / 1048576)} Mo.` }
  }
  const header = new Uint8Array(await file.slice(0, 1032).arrayBuffer())
  if (!detectPdfSignature(header)) {
    return { ok: false, error: `${name} : le contenu n'est pas celui d'un PDF valide.` }
  }
  return { ok: true, name }
}

export function compositeOnWhite(rgba, pixelCount) {
  const rgb = new Uint8ClampedArray(pixelCount * 3)
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4
    const a = rgba[o + 3] / 255
    const inv = 255 * (1 - a)
    const p = i * 3
    rgb[p] = rgba[o] * a + inv
    rgb[p + 1] = rgba[o + 1] * a + inv
    rgb[p + 2] = rgba[o + 2] * a + inv
  }
  return rgb
}

function axisWeights(srcLen, dstLen) {
  const scale = srcLen / dstLen
  const starts = new Int32Array(dstLen)
  const counts = new Int32Array(dstLen)
  const weights = new Array(dstLen)
  for (let i = 0; i < dstLen; i++) {
    if (scale > 1) {
      const lo = i * scale
      const hi = (i + 1) * scale
      const first = Math.floor(lo)
      const last = Math.min(srcLen - 1, Math.ceil(hi) - 1)
      const w = []
      let total = 0
      for (let s = first; s <= last; s++) {
        const overlap = Math.min(hi, s + 1) - Math.max(lo, s)
        w.push(overlap)
        total += overlap
      }
      for (let k = 0; k < w.length; k++) {
        w[k] /= total
      }
      starts[i] = first
      counts[i] = w.length
      weights[i] = w
    } else {
      const center = (i + 0.5) * scale - 0.5
      const first = Math.floor(center)
      const frac = center - first
      const a = Math.min(srcLen - 1, Math.max(0, first))
      const b = Math.min(srcLen - 1, Math.max(0, first + 1))
      if (a === b) {
        starts[i] = a
        counts[i] = 1
        weights[i] = [1]
      } else {
        starts[i] = a
        counts[i] = 2
        weights[i] = [1 - frac, frac]
      }
    }
  }
  return { starts, counts, weights }
}

export function resizeInterleaved(src, srcW, srcH, channels, dstW, dstH) {
  if (srcW === dstW && srcH === dstH) {
    return Float32Array.from(src)
  }
  const ax = axisWeights(srcW, dstW)
  const ay = axisWeights(srcH, dstH)
  const tmp = new Float32Array(dstW * srcH * channels)
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < dstW; x++) {
      const start = ax.starts[x]
      const w = ax.weights[x]
      const count = ax.counts[x]
      for (let c = 0; c < channels; c++) {
        let acc = 0
        for (let k = 0; k < count; k++) {
          acc += src[(y * srcW + start + k) * channels + c] * w[k]
        }
        tmp[(y * dstW + x) * channels + c] = acc
      }
    }
  }
  const out = new Float32Array(dstW * dstH * channels)
  for (let y = 0; y < dstH; y++) {
    const start = ay.starts[y]
    const w = ay.weights[y]
    const count = ay.counts[y]
    for (let x = 0; x < dstW; x++) {
      for (let c = 0; c < channels; c++) {
        let acc = 0
        for (let k = 0; k < count; k++) {
          acc += tmp[((start + k) * dstW + x) * channels + c] * w[k]
        }
        out[(y * dstW + x) * channels + c] = acc
      }
    }
  }
  return out
}

export function resizePlane(plane, srcW, srcH, dstW, dstH) {
  return resizeInterleaved(plane, srcW, srcH, 1, dstW, dstH)
}

function fitSize(width, height, maxSide) {
  const longest = Math.max(width, height)
  if (longest <= maxSide) {
    return [width, height]
  }
  const ratio = maxSide / longest
  return [Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio))]
}

function toRoundedRgb(float, count) {
  const out = new Uint8ClampedArray(count)
  for (let i = 0; i < count; i++) {
    out[i] = Math.round(float[i])
  }
  return out
}

export function quantizedColorKey(r, g, b) {
  const qr = Math.min(7, Math.floor(r / HISTOGRAM_STEP))
  const qg = Math.min(7, Math.floor(g / HISTOGRAM_STEP))
  const qb = Math.min(7, Math.floor(b / HISTOGRAM_STEP))
  return cantor(cantor(qr, qg), qb)
}

export function buildHistogram(planes, count) {
  const histogram = new Map()
  for (let i = 0; i < count; i++) {
    const key = quantizedColorKey(planes.r[i], planes.g[i], planes.b[i])
    histogram.set(key, (histogram.get(key) || 0) + 1)
  }
  for (const [key, value] of histogram) {
    histogram.set(key, value / count)
  }
  return histogram
}

export function createLevel(rgb, srcW, srcH, maxSide) {
  const [w, h] = fitSize(srcW, srcH, maxSide)
  let pixels
  if (w === srcW && h === srcH) {
    pixels = rgb
  } else {
    pixels = toRoundedRgb(resizeInterleaved(rgb, srcW, srcH, 3, w, h), w * h * 3)
  }
  return {
    width: w,
    height: h,
    encoded: encodeRgbBuffer(pixels, w * h),
    planesCache: null,
    histogramCache: null
  }
}

export function levelPlanes(level) {
  if (!level.planesCache) {
    level.planesCache = decodeToPlanes(level.encoded)
  }
  return level.planesCache
}

export function levelHistogram(level) {
  if (!level.histogramCache) {
    level.histogramCache = buildHistogram(levelPlanes(level), level.width * level.height)
  }
  return level.histogramCache
}

export function buildRepresentation({ id, name, width, height, rgba, rgb }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new RangeError("Dimensions d'image invalides")
  }
  const count = width * height
  let opaque
  if (rgb) {
    if (rgb.length !== count * 3) {
      throw new RangeError("Taille du buffer RGB incohérente avec les dimensions")
    }
    opaque = rgb
  } else {
    if (!rgba || rgba.length !== count * 4) {
      throw new RangeError("Taille du buffer RGBA incohérente avec les dimensions")
    }
    opaque = compositeOnWhite(rgba, count)
  }
  const longest = Math.max(width, height)
  const largest = LEVEL_SIZES[LEVEL_SIZES.length - 1]
  const sizes = LEVEL_SIZES.filter((size) => size < longest && size < largest)
  sizes.push(Math.min(longest, largest))
  const levels = sizes.map((size) => createLevel(opaque, width, height, size))
  return {
    id,
    name,
    originalWidth: width,
    originalHeight: height,
    aspect: width / height,
    levels
  }
}

export function imageDataToRepresentation(meta, imageData) {
  return buildRepresentation({
    id: meta.id,
    name: meta.name,
    width: imageData.width,
    height: imageData.height,
    rgba: imageData.data
  })
}

export async function loadImageData(file, maxSide = 640) {
  const bitmap = await createImageBitmap(file)
  const originalWidth = bitmap.width
  const originalHeight = bitmap.height
  const [w, h] = fitSize(originalWidth, originalHeight, maxSide)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const context = canvas.getContext("2d", { willReadFrequently: true })
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.clearRect(0, 0, w, h)
  context.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const imageData = context.getImageData(0, 0, w, h)
  return { width: w, height: h, originalWidth, originalHeight, data: imageData.data }
}

export function rgbaToRgbBase64Source(rgba, width, height, maxSide = 320) {
  const count = width * height
  const rgb = compositeOnWhite(rgba, count)
  const [w, h] = fitSize(width, height, maxSide)
  if (w === width && h === height) {
    return { width, height, rgb }
  }
  const resized = toRoundedRgb(resizeInterleaved(rgb, width, height, 3, w, h), w * h * 3)
  return { width: w, height: h, rgb: resized }
}
