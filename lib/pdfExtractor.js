const IMAGE_KIND = { GRAYSCALE_1BPP: 1, RGB_24BPP: 2, RGBA_32BPP: 3 }

export class PdfReadError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

export async function openPdf(pdfjsLib, data) {
  const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(data)
  try {
    const task = pdfjsLib.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true })
    return await task.promise
  } catch (error) {
    if (error && error.name === "PasswordException") {
      throw new PdfReadError("password", "Ce PDF est protégé par un mot de passe et ne peut pas être analysé.")
    }
    if (error && (error.name === "InvalidPDFException" || error.name === "FormatError" || error.name === "MissingPDFException")) {
      throw new PdfReadError("corrupt", "Le fichier PDF est corrompu ou illisible.")
    }
    throw new PdfReadError("unknown", `Impossible de lire le PDF : ${error && error.message ? error.message : "erreur inconnue"}`)
  }
}

function cleanItemText(text) {
  return text.replace(/ /g, " ").replace(/­/g, "").replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl")
}

function buildSegments(items, pageNumber, pageHeight) {
  const entries = []
  for (const item of items) {
    if (typeof item.str !== "string" || item.str.trim() === "") {
      continue
    }
    const fontSize = Math.abs(item.transform[3]) || Math.abs(item.height) || 10
    entries.push({
      str: cleanItemText(item.str),
      x: item.transform[4],
      y: pageHeight - item.transform[5],
      w: item.width,
      fs: fontSize
    })
  }
  entries.sort((a, b) => a.y - b.y || a.x - b.x)
  const rows = []
  for (const entry of entries) {
    const row = rows[rows.length - 1]
    if (row && Math.abs(entry.y - row.y) <= Math.max(2, 0.45 * Math.max(entry.fs, row.fs))) {
      row.items.push(entry)
      row.y = (row.y * (row.items.length - 1) + entry.y) / row.items.length
    } else {
      rows.push({ y: entry.y, items: [entry] })
    }
  }
  const segments = []
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x)
    let current = null
    for (const item of row.items) {
      if (!current) {
        current = { text: item.str, x: item.x, x1: item.x + item.w, y: row.y, fs: item.fs, fsMax: item.fs, page: pageNumber }
        continue
      }
      const gap = item.x - current.x1
      if (gap > 3.5 * Math.max(item.fs, current.fs)) {
        segments.push(current)
        current = { text: item.str, x: item.x, x1: item.x + item.w, y: row.y, fs: item.fs, fsMax: item.fs, page: pageNumber }
      } else {
        const needsSpace = gap > 0.12 * item.fs && !/\s$/.test(current.text) && !/^\s/.test(item.str)
        current.text += (needsSpace ? " " : "") + item.str
        current.x1 = item.x + item.w
        current.fsMax = Math.max(current.fsMax, item.fs)
      }
    }
    if (current) {
      segments.push(current)
    }
  }
  return segments
}

function detectGutters(segments, pageWidth) {
  const narrow = segments.filter((s) => s.x1 - s.x < pageWidth * 0.6)
  if (narrow.length < 6) {
    return []
  }
  const bins = new Uint16Array(Math.ceil(pageWidth) + 2)
  for (const s of narrow) {
    const from = Math.max(0, Math.floor(s.x))
    const to = Math.min(bins.length - 1, Math.ceil(s.x1))
    for (let i = from; i <= to; i++) {
      bins[i]++
    }
  }
  const gutters = []
  let runStart = -1
  const lo = Math.floor(pageWidth * 0.15)
  const hi = Math.ceil(pageWidth * 0.85)
  for (let i = lo; i <= hi; i++) {
    if (bins[i] === 0) {
      if (runStart < 0) {
        runStart = i
      }
    } else if (runStart >= 0) {
      if (i - runStart >= 10) {
        gutters.push((runStart + i) / 2)
      }
      runStart = -1
    }
  }
  const valid = []
  for (const g of gutters) {
    const left = narrow.filter((s) => (s.x + s.x1) / 2 < g).length
    const right = narrow.length - left
    if (left >= narrow.length * 0.12 && right >= narrow.length * 0.12) {
      valid.push(g)
    }
  }
  return valid
}

function toLines(segments, gutters, pageWidth) {
  const columnOf = (segment) => {
    if (segment.x1 - segment.x > pageWidth * 0.6) {
      return 0
    }
    const center = (segment.x + segment.x1) / 2
    let column = 0
    for (const g of gutters) {
      if (center > g) {
        column++
      }
    }
    return column
  }
  const tagged = segments.map((s) => ({ ...s, column: columnOf(s) }))
  tagged.sort((a, b) => a.column - b.column || a.y - b.y || a.x - b.x)
  const lines = []
  for (const s of tagged) {
    const last = lines[lines.length - 1]
    if (last && last.column === s.column && Math.abs(last.y - s.y) <= Math.max(2, 0.45 * Math.max(last.fs, s.fs))) {
      last.text += " " + s.text
      last.x1 = Math.max(last.x1, s.x1)
      last.fsMax = Math.max(last.fsMax, s.fsMax)
    } else {
      lines.push({ ...s })
    }
  }
  return lines.map((line) => ({ ...line, text: line.text.replace(/\s+/g, " ").trim() })).filter((line) => line.text.length > 0)
}

export async function extractTextLines(pdf, maxPages = 8) {
  const pageCount = pdf.numPages
  const limit = Math.min(pageCount, maxPages)
  const lines = []
  const pages = []
  let characters = 0
  for (let pageNumber = 1; pageNumber <= limit; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const view = page.view
    const width = view[2] - view[0]
    const height = view[3] - view[1]
    const content = await page.getTextContent()
    const segments = buildSegments(content.items, pageNumber, height)
    const gutters = detectGutters(segments, width)
    const pageLines = toLines(segments, gutters, width)
    for (const line of pageLines) {
      characters += line.text.length
      lines.push(line)
    }
    pages.push({ pageNumber, width, height, columns: gutters.length + 1 })
  }
  return { lines, pages, pageCount, characters, analyzedPages: limit }
}

function multiply(m, n) {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5]
  ]
}

function unitSquareBounds(ctm) {
  const corners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1]
  ].map(([x, y]) => [x * ctm[0] + y * ctm[2] + ctm[4], x * ctm[1] + y * ctm[3] + ctm[5]])
  const xs = corners.map((c) => c[0])
  const ys = corners.map((c) => c[1])
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

function waitForObject(page, id) {
  return new Promise((resolve) => {
    const store = id.startsWith("g_") ? page.commonObjs : page.objs
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve(null)
      }
    }, 5000)
    try {
      store.get(id, (value) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(value)
        }
      })
    } catch (error) {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(null)
      }
    }
  })
}

function bitmapToRgba(bitmap) {
  if (typeof document === "undefined") {
    return null
  }
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  context.drawImage(bitmap, 0, 0)
  return context.getImageData(0, 0, bitmap.width, bitmap.height).data
}

export function imageObjectToRgba(image) {
  if (!image) {
    return null
  }
  if (image.bitmap) {
    const data = bitmapToRgba(image.bitmap)
    return data ? { width: image.bitmap.width, height: image.bitmap.height, rgba: data } : null
  }
  const { width, height, data, kind } = image
  if (!data || !width || !height) {
    return null
  }
  const count = width * height
  const rgba = new Uint8ClampedArray(count * 4)
  if (kind === IMAGE_KIND.RGBA_32BPP || data.length === count * 4) {
    rgba.set(data.subarray(0, count * 4))
  } else if (kind === IMAGE_KIND.RGB_24BPP || data.length === count * 3) {
    for (let i = 0; i < count; i++) {
      rgba[i * 4] = data[i * 3]
      rgba[i * 4 + 1] = data[i * 3 + 1]
      rgba[i * 4 + 2] = data[i * 3 + 2]
      rgba[i * 4 + 3] = 255
    }
  } else if (kind === IMAGE_KIND.GRAYSCALE_1BPP) {
    const stride = Math.ceil(width / 8)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = (data[y * stride + (x >> 3)] >> (7 - (x & 7))) & 1
        const o = (y * width + x) * 4
        const v = bit ? 255 : 0
        rgba[o] = v
        rgba[o + 1] = v
        rgba[o + 2] = v
        rgba[o + 3] = 255
      }
    }
  } else if (data.length === count) {
    for (let i = 0; i < count; i++) {
      rgba[i * 4] = data[i]
      rgba[i * 4 + 1] = data[i]
      rgba[i * 4 + 2] = data[i]
      rgba[i * 4 + 3] = 255
    }
  } else {
    return null
  }
  return { width, height, rgba }
}

export function analyzeImagePixels(rgba, width, height) {
  const targetSide = 48
  const sx = Math.max(1, Math.floor(width / targetSide))
  const sy = Math.max(1, Math.floor(height / targetSide))
  const bins = new Map()
  let samples = 0
  let sum = 0
  let sumSq = 0
  let skin = 0
  let whiteish = 0
  for (let y = 0; y < height; y += sy) {
    for (let x = 0; x < width; x += sx) {
      const o = (y * width + x) * 4
      const a = rgba[o + 3] / 255
      const r = rgba[o] * a + 255 * (1 - a)
      const g = rgba[o + 1] * a + 255 * (1 - a)
      const b = rgba[o + 2] * a + 255 * (1 - a)
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      sum += luma
      sumSq += luma * luma
      samples++
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
      bins.set(key, (bins.get(key) || 0) + 1)
      if (luma > 245) {
        whiteish++
      }
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      if (r > 95 && g > 40 && b > 20 && max - min > 15 && Math.abs(r - g) > 15 && r > g && r > b) {
        skin++
      }
    }
  }
  const mean = sum / samples
  const std = Math.sqrt(Math.max(0, sumSq / samples - mean * mean))
  let richBins = 0
  for (const count of bins.values()) {
    if (count / samples >= 0.004) {
      richBins++
    }
  }
  const skinRatio = skin / samples
  const whiteRatio = whiteish / samples
  const colorScore = Math.min(1, richBins / 45)
  const contrastScore = Math.min(1, std / 40)
  const skinScore = Math.min(1, skinRatio * 3)
  let photoLikeness = 0.6 * colorScore + 0.15 * contrastScore + 0.25 * skinScore - (whiteRatio > 0.7 ? 0.3 : 0)
  if (richBins < 10) {
    photoLikeness *= richBins / 10
  }
  photoLikeness = Math.max(0, Math.min(1, photoLikeness))
  return { richBins, std, skinRatio, whiteRatio, photoLikeness }
}

export function scorePhotoCandidate(candidate) {
  const { bbox, pageWidth, pageHeight, pageNumber, nativeWidth, nativeHeight, stats } = candidate
  const aspect = bbox.w / Math.max(bbox.h, 0.0001)
  const areaFraction = (bbox.w * bbox.h) / (pageWidth * pageHeight)
  const reasons = []
  if (areaFraction > 0.45) {
    return { score: 0, reasons: ["Image occupant la majeure partie de la page (fond ou scan)"] }
  }
  if (bbox.w < 40 || bbox.h < 40 || nativeWidth < 48 || nativeHeight < 48) {
    return { score: 0, reasons: ["Image trop petite (icône ou logo)"] }
  }
  let aspectScore = 0.05
  if (aspect >= 0.65 && aspect <= 1.15) {
    aspectScore = 1
  } else if (aspect >= 0.5 && aspect <= 1.4) {
    aspectScore = 0.7
  } else if (aspect >= 0.4 && aspect <= 1.8) {
    aspectScore = 0.35
  }
  let sizeScore = 0.1
  if (areaFraction >= 0.012 && areaFraction <= 0.12) {
    sizeScore = 1
  } else if (areaFraction >= 0.006 && areaFraction <= 0.2) {
    sizeScore = 0.7
  } else if (areaFraction >= 0.003 && areaFraction <= 0.3) {
    sizeScore = 0.35
  }
  const centerY = (bbox.top + bbox.h / 2) / pageHeight
  let positionScore = 0.2
  if (centerY <= 0.35) {
    positionScore = 1
  } else if (centerY <= 0.5) {
    positionScore = 0.7
  } else if (centerY <= 0.7) {
    positionScore = 0.4
  }
  const pageFactor = pageNumber === 1 ? 1 : pageNumber === 2 ? 0.6 : 0.3
  const contentScore = stats.photoLikeness
  const score = (0.3 * aspectScore + 0.2 * sizeScore + 0.2 * positionScore + 0.3 * contentScore) * pageFactor
  if (aspectScore >= 0.7) {
    reasons.push("Proportions compatibles avec un portrait")
  }
  if (sizeScore >= 0.7) {
    reasons.push("Taille typique d'une photo de profil")
  }
  if (positionScore >= 0.7) {
    reasons.push("Située dans la partie haute de la page")
  }
  if (contentScore >= 0.5) {
    reasons.push("Contenu riche en couleurs et en contrastes")
  } else {
    reasons.push("Contenu peu photographique (aplats, peu de couleurs)")
  }
  return { score, reasons }
}

export async function extractEmbeddedImages(pdfjsLib, pdf, maxPages = 3) {
  const OPS = pdfjsLib.OPS
  const limit = Math.min(pdf.numPages, maxPages)
  const candidates = []
  for (let pageNumber = 1; pageNumber <= limit; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const view = page.view
    const pageWidth = view[2] - view[0]
    const pageHeight = view[3] - view[1]
    const operatorList = await page.getOperatorList()
    let ctm = [1, 0, 0, 1, 0, 0]
    const stack = []
    let index = 0
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i]
      const args = operatorList.argsArray[i]
      if (fn === OPS.save) {
        stack.push(ctm)
      } else if (fn === OPS.restore) {
        ctm = stack.pop() || [1, 0, 0, 1, 0, 0]
      } else if (fn === OPS.transform) {
        ctm = multiply(args, ctm)
      } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintJpegXObject) {
        const bounds = unitSquareBounds(ctm)
        const imageObject = fn === OPS.paintInlineImageXObject ? args[0] : await waitForObject(page, args[0])
        const decoded = imageObjectToRgba(imageObject)
        if (!decoded) {
          continue
        }
        const bbox = {
          x: bounds.x - view[0],
          top: pageHeight - (bounds.y - view[1] + bounds.h),
          w: bounds.w,
          h: bounds.h
        }
        const stats = analyzeImagePixels(decoded.rgba, decoded.width, decoded.height)
        const { score, reasons } = scorePhotoCandidate({
          bbox,
          pageWidth,
          pageHeight,
          pageNumber,
          nativeWidth: decoded.width,
          nativeHeight: decoded.height,
          stats
        })
        candidates.push({
          id: `p${pageNumber}i${index++}`,
          page: pageNumber,
          nativeWidth: decoded.width,
          nativeHeight: decoded.height,
          bbox,
          pageWidth,
          pageHeight,
          areaFraction: (bounds.w * bounds.h) / (pageWidth * pageHeight),
          stats,
          score,
          reasons,
          rgba: decoded.rgba
        })
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score)
  return candidates
}

export function rgbaToCanvas(rgba, width, height) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  const imageData = context.createImageData(width, height)
  imageData.data.set(rgba)
  context.putImageData(imageData, 0, 0)
  return canvas
}

export async function renderPage(pdf, pageNumber, canvas, targetWidth = 900) {
  const page = await pdf.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = targetWidth / base.width
  const viewport = page.getViewport({ scale })
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const context = canvas.getContext("2d")
  await page.render({ canvasContext: context, viewport }).promise
  return { width: canvas.width, height: canvas.height, scale }
}

export async function analyzePdf(pdfjsLib, data, options = {}) {
  const pdf = await openPdf(pdfjsLib, data)
  const text = await extractTextLines(pdf, options.maxTextPages || 8)
  let images = []
  if (options.images !== false) {
    images = await extractEmbeddedImages(pdfjsLib, pdf, options.maxImagePages || 3)
  }
  const noText = text.characters < 40 * text.analyzedPages
  const scanned = noText && (options.images === false || images.length > 0)
  return { pdf, ...text, images, scanned }
}
