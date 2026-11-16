import { cantor, cantorReverse } from "./cantor.js"
import { levelPlanes, levelHistogram, resizePlane, buildHistogram } from "./imageProcessor.js"

export const DEFAULT_OPTIONS = {
  minScale: 0.14,
  scaleStep: 1.15,
  candidateCount: 3,
  prefilterMin: 0.4,
  coarseMin: 0.3,
  noMatchBelow: 0.3,
  earlyExitScore: 0.985,
  fullCoverage: 0.88,
  aspectTolerance: 0.05
}

const MIN_TEMPLATE_SIDE = 6

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

export function exactMatchRatio(a, b) {
  const la = a.levels[a.levels.length - 1]
  const lb = b.levels[b.levels.length - 1]
  if (la.width !== lb.width || la.height !== lb.height) {
    return 0
  }
  let equal = 0
  for (let i = 0; i < la.encoded.length; i++) {
    if (la.encoded[i] === lb.encoded[i]) {
      equal++
    }
  }
  return equal / la.encoded.length
}

function neighborKeys(key) {
  const [first, qb] = cantorReverse(key)
  const [qr, qg] = cantorReverse(first)
  const keys = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dg = -1; dg <= 1; dg++) {
      for (let db = -1; db <= 1; db++) {
        const r = qr + dr
        const g = qg + dg
        const b = qb + db
        if (r >= 0 && g >= 0 && b >= 0 && r < 8 && g < 8 && b < 8) {
          keys.push(cantor(cantor(r, g), b))
        }
      }
    }
  }
  return keys
}

export function colorContainment(needleHistogram, hayHistogram) {
  let contained = 0
  for (const [key, mass] of needleHistogram) {
    const keys = neighborKeys(key)
    for (let i = 0; i < keys.length; i++) {
      if (hayHistogram.has(keys[i])) {
        contained += mass
        break
      }
    }
  }
  return contained
}

export function histogramIntersection(a, b) {
  let total = 0
  for (const [key, value] of a) {
    const other = b.get(key)
    if (other !== undefined) {
      total += Math.min(value, other)
    }
  }
  return total
}

function buildIntegral(plane, w, h) {
  const stride = w + 1
  const sum = new Float64Array(stride * (h + 1))
  const sq = new Float64Array(stride * (h + 1))
  for (let y = 0; y < h; y++) {
    let rowSum = 0
    let rowSq = 0
    for (let x = 0; x < w; x++) {
      const v = plane[y * w + x]
      rowSum += v
      rowSq += v * v
      sum[(y + 1) * stride + x + 1] = sum[y * stride + x + 1] + rowSum
      sq[(y + 1) * stride + x + 1] = sq[y * stride + x + 1] + rowSq
    }
  }
  return { sum, sq }
}

function makeTemplate(plane, srcW, srcH, tw, th) {
  const resized = resizePlane(plane, srcW, srcH, tw, th)
  const n = tw * th
  let mean = 0
  for (let i = 0; i < n; i++) {
    mean += resized[i]
  }
  mean /= n
  let ssq = 0
  for (let i = 0; i < n; i++) {
    resized[i] -= mean
    ssq += resized[i] * resized[i]
  }
  const norm = Math.sqrt(ssq)
  return { data: resized, tw, th, mean, norm, flat: norm / Math.sqrt(n) < 2 }
}

function scanTemplate(hay, tmpl, bounds) {
  const { plane, w, integral } = hay
  const { tw, th, data, norm, mean, flat } = tmpl
  const n = tw * th
  const stride = w + 1
  const sums = integral.sum
  const squares = integral.sq
  let best = { score: -1, x: bounds.x0, y: bounds.y0 }
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    const top = y * stride
    const bottom = (y + th) * stride
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      const sum = sums[bottom + x + tw] - sums[top + x + tw] - sums[bottom + x] + sums[top + x]
      const sq = squares[bottom + x + tw] - squares[top + x + tw] - squares[bottom + x] + squares[top + x]
      const variance = sq - (sum * sum) / n
      let score
      if (flat) {
        const std = Math.sqrt(Math.max(0, variance) / n)
        score = std < 5 ? Math.max(0, 1 - Math.abs(sum / n - mean) / 40) : 0
      } else if (variance < n * 4) {
        score = 0
      } else {
        let cross = 0
        for (let j = 0; j < th; j++) {
          const ti = j * tw
          const si = (y + j) * w + x
          for (let i = 0; i < tw; i++) {
            cross += data[ti + i] * plane[si + i]
          }
        }
        score = cross / (norm * Math.sqrt(variance))
      }
      if (score > best.score) {
        best = { score, x, y }
      }
    }
  }
  return best
}

function levelContext(rep, index) {
  const level = rep.levels[index]
  const planes = levelPlanes(level)
  return { level, planes, w: level.width, h: level.height }
}

function hayContext(rep, index) {
  const ctx = levelContext(rep, index)
  ctx.plane = ctx.planes.gray
  ctx.integral = buildIntegral(ctx.plane, ctx.w, ctx.h)
  return ctx
}

function coarseSearch(needle, hay, options) {
  const hayCtx = hayContext(hay, 0)
  const needleCtx = levelContext(needle, needle.levels.length - 1)
  const { w: hw, h: hh } = hayCtx
  const aspect = needle.aspect
  const fMax = Math.min(1, (hh * aspect) / hw)
  const found = []
  let f = fMax
  let first = true
  while (f >= options.minScale || first) {
    const tw = Math.max(1, Math.round(f * hw))
    const th = Math.max(1, Math.min(hh, Math.round(tw / aspect)))
    if (!first && (tw < MIN_TEMPLATE_SIDE || th < MIN_TEMPLATE_SIDE)) {
      break
    }
    if (tw <= hw && th <= hh) {
      const tmpl = makeTemplate(needleCtx.planes.gray, needleCtx.w, needleCtx.h, tw, th)
      const best = scanTemplate(hayCtx, tmpl, { x0: 0, x1: hw - tw, y0: 0, y1: hh - th })
      found.push({ score: best.score, x: best.x, y: best.y, tw, th })
      if (first && best.score >= options.earlyExitScore) {
        break
      }
    }
    first = false
    f /= options.scaleStep
  }
  found.sort((p, q) => q.score - p.score)
  const picked = []
  for (const candidate of found) {
    if (picked.length >= options.candidateCount) {
      break
    }
    const cx = candidate.x + candidate.tw / 2
    const cy = candidate.y + candidate.th / 2
    const duplicate = picked.some((other) => {
      const ox = other.x + other.tw / 2
      const oy = other.y + other.th / 2
      const distance = Math.hypot(cx - ox, cy - oy)
      const ratio = Math.max(candidate.tw, other.tw) / Math.min(candidate.tw, other.tw)
      return distance < 0.25 * Math.max(candidate.tw, other.tw) && ratio < 1.4
    })
    if (!duplicate) {
      picked.push(candidate)
    }
  }
  return picked
}

function refineCandidate(needle, hay, candidate, fromIndex, toIndex, scaleSet, radius) {
  const hayCtx = hayContext(hay, toIndex)
  const fromWidth = hay.levels[fromIndex].width
  const ratio = hayCtx.w / fromWidth
  const needleCtx = levelContext(needle, needle.levels.length - 1)
  const aspect = needle.aspect
  const centerX = (candidate.x + candidate.tw / 2) * ratio
  const centerY = (candidate.y + candidate.th / 2) * ratio
  let best = null
  for (const s of scaleSet) {
    const tw = Math.round(candidate.tw * ratio * s)
    const th = Math.max(1, Math.min(hayCtx.h, Math.round(tw / aspect)))
    if (tw < 2 || tw > hayCtx.w || th > hayCtx.h) {
      continue
    }
    const tmpl = makeTemplate(needleCtx.planes.gray, needleCtx.w, needleCtx.h, tw, th)
    const px = Math.round(centerX - tw / 2)
    const py = Math.round(centerY - th / 2)
    const bounds = {
      x0: Math.max(0, px - radius),
      x1: Math.min(hayCtx.w - tw, px + radius),
      y0: Math.max(0, py - radius),
      y1: Math.min(hayCtx.h - th, py + radius)
    }
    if (bounds.x0 > bounds.x1 || bounds.y0 > bounds.y1) {
      continue
    }
    const result = scanTemplate(hayCtx, tmpl, bounds)
    if (!best || result.score > best.score) {
      best = { score: result.score, x: result.x, y: result.y, tw, th }
    }
  }
  return best || candidate
}

function planeStats(a, b, n) {
  let ma = 0
  let mb = 0
  for (let i = 0; i < n; i++) {
    ma += a[i]
    mb += b[i]
  }
  ma /= n
  mb /= n
  let va = 0
  let vb = 0
  let cov = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma
    const db = b[i] - mb
    va += da * da
    vb += db * db
    cov += da * db
  }
  return { ma, mb, va: va / n, vb: vb / n, cov: cov / n }
}

export function znccPlanes(a, b, n) {
  const { va, vb, cov } = planeStats(a, b, n)
  const flatA = va < 4
  const flatB = vb < 4
  if (flatA && flatB) {
    return 1
  }
  if (flatA || flatB) {
    return 0
  }
  return cov / Math.sqrt(va * vb)
}

function gainCorrectedResidual(template, region, n) {
  const { ma, mb, va, cov } = planeStats(template, region, n)
  let a = 1
  if (va > 4) {
    a = Math.max(0.6, Math.min(1.6, cov / va))
  }
  const offset = mb - a * ma
  let residual = 0
  for (let i = 0; i < n; i++) {
    residual += Math.abs(region[i] - (a * template[i] + offset))
  }
  return residual / n / 255
}

function meanAbsDifference(a, b, n) {
  let total = 0
  for (let i = 0; i < n; i++) {
    total += Math.abs(a[i] - b[i])
  }
  return total / n / 255
}

function cropPlane(plane, srcW, x, y, w, h) {
  const out = new Float32Array(w * h)
  for (let j = 0; j < h; j++) {
    const so = (y + j) * srcW + x
    out.set(plane.subarray(so, so + w), j * w)
  }
  return out
}

function evaluateRegion(needle, hay, region) {
  const hayCtx = levelContext(hay, hay.levels.length - 1)
  const needleCtx = levelContext(needle, needle.levels.length - 1)
  const tw = Math.min(region.tw, hayCtx.w)
  const th = Math.min(region.th, hayCtx.h)
  const x = Math.max(0, Math.min(hayCtx.w - tw, region.x))
  const y = Math.max(0, Math.min(hayCtx.h - th, region.y))
  const n = tw * th
  const sample = {
    r: cropPlane(hayCtx.planes.r, hayCtx.w, x, y, tw, th),
    g: cropPlane(hayCtx.planes.g, hayCtx.w, x, y, tw, th),
    b: cropPlane(hayCtx.planes.b, hayCtx.w, x, y, tw, th),
    gray: cropPlane(hayCtx.planes.gray, hayCtx.w, x, y, tw, th)
  }
  const model = {
    r: resizePlane(needleCtx.planes.r, needleCtx.w, needleCtx.h, tw, th),
    g: resizePlane(needleCtx.planes.g, needleCtx.w, needleCtx.h, tw, th),
    b: resizePlane(needleCtx.planes.b, needleCtx.w, needleCtx.h, tw, th),
    gray: resizePlane(needleCtx.planes.gray, needleCtx.w, needleCtx.h, tw, th)
  }
  const corrGray = znccPlanes(model.gray, sample.gray, n)
  const corrR = znccPlanes(model.r, sample.r, n)
  const corrG = znccPlanes(model.g, sample.g, n)
  const corrB = znccPlanes(model.b, sample.b, n)
  const structural = clamp01(0.5 * corrGray + 0.5 * ((corrR + corrG + corrB) / 3))
  const rawDifference = (meanAbsDifference(model.r, sample.r, n) + meanAbsDifference(model.g, sample.g, n) + meanAbsDifference(model.b, sample.b, n)) / 3
  const correctedDifference = (gainCorrectedResidual(model.r, sample.r, n) + gainCorrectedResidual(model.g, sample.g, n) + gainCorrectedResidual(model.b, sample.b, n)) / 3
  const photometric = 0.4 * (1 - Math.min(1, rawDifference / 0.35)) + 0.6 * (1 - Math.min(1, correctedDifference / 0.1))
  const histogram = histogramIntersection(buildHistogram(model, n), buildHistogram(sample, n))
  let score = 0.55 * structural + 0.3 * photometric + 0.15 * histogram
  if (structural < 0.6) {
    score *= structural / 0.6
  }
  return {
    score: clamp01(score),
    structural,
    photometric: clamp01(photometric),
    histogram,
    rawDifference,
    region: { x, y, tw, th },
    hayWidth: hayCtx.w,
    hayHeight: hayCtx.h
  }
}

function searchContained(needle, hay, options) {
  const containment = colorContainment(levelHistogram(needle.levels[0]), levelHistogram(hay.levels[0]))
  if (containment < options.prefilterMin) {
    return null
  }
  const candidates = coarseSearch(needle, hay, options)
  if (candidates.length === 0 || candidates[0].score < options.coarseMin) {
    return null
  }
  const lastIndex = hay.levels.length - 1
  let refined = candidates
  let fromIndex = 0
  if (lastIndex >= 1) {
    const midIndex = lastIndex >= 2 ? 1 : lastIndex
    refined = refined.map((candidate) => refineCandidate(needle, hay, candidate, 0, midIndex, [0.88, 0.94, 1, 1.06, 1.12], 4))
    refined.sort((p, q) => q.score - p.score)
    fromIndex = midIndex
    if (lastIndex > midIndex) {
      refined = refined.slice(0, 2).map((candidate) => refineCandidate(needle, hay, candidate, midIndex, lastIndex, [0.97, 1, 1.03], 3))
      refined.sort((p, q) => q.score - p.score)
      fromIndex = lastIndex
    }
  }
  const scaleToFine = hay.levels[lastIndex].width / hay.levels[fromIndex].width
  const winner = refined[0]
  const evaluation = evaluateRegion(needle, hay, {
    x: Math.round(winner.x * scaleToFine),
    y: Math.round(winner.y * scaleToFine),
    tw: Math.round(winner.tw * scaleToFine),
    th: Math.round(winner.th * scaleToFine)
  })
  const hayArea = evaluation.hayWidth * evaluation.hayHeight
  const coverage = (evaluation.region.tw * evaluation.region.th) / hayArea
  return { ...evaluation, coverage, needleId: needle.id, hayId: hay.id, containment }
}

function describeMatch(match, a, b, options) {
  const needle = match.needleId === a.id ? a : b
  const hay = match.hayId === a.id ? a : b
  const aspectGap = Math.abs(needle.aspect - hay.aspect) / hay.aspect
  const isFull = match.coverage >= options.fullCoverage && aspectGap <= options.aspectTolerance
  const { region, hayWidth, hayHeight } = match
  return {
    score: match.score,
    kind: isFull ? "full" : "partial",
    containerId: isFull ? null : hay.id,
    containedId: isFull ? null : needle.id,
    region: isFull
      ? null
      : {
          x: region.x / hayWidth,
          y: region.y / hayHeight,
          w: region.tw / hayWidth,
          h: region.th / hayHeight
        },
    coverage: match.coverage,
    metrics: {
      structural: match.structural,
      photometric: match.photometric,
      histogram: match.histogram,
      containment: match.containment
    }
  }
}

export function compareRepresentations(a, b, userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions }
  const exactRatio = exactMatchRatio(a, b)
  if (exactRatio === 1) {
    return {
      score: 1,
      kind: "exact",
      containerId: null,
      containedId: null,
      region: null,
      coverage: 1,
      metrics: { structural: 1, photometric: 1, histogram: 1, containment: 1, exactRatio }
    }
  }
  const forward = searchContained(a, b, options)
  const backward = searchContained(b, a, options)
  const matches = [forward, backward].filter(Boolean)
  if (matches.length === 0) {
    return {
      score: 0,
      kind: "none",
      containerId: null,
      containedId: null,
      region: null,
      coverage: 0,
      metrics: { structural: 0, photometric: 0, histogram: 0, containment: 0, exactRatio }
    }
  }
  matches.sort((p, q) => q.score - p.score)
  const described = describeMatch(matches[0], a, b, options)
  described.metrics.exactRatio = exactRatio
  if (described.score < options.noMatchBelow) {
    described.kind = "none"
    described.containerId = null
    described.containedId = null
    described.region = null
  }
  return described
}

export function searchSimilar(reference, candidates, userOptions = {}, onProgress = null, cache = null) {
  const results = []
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const key = `${reference.id}|${candidate.id}`
    let result = cache ? cache.get(key) : undefined
    if (!result) {
      result = compareRepresentations(reference, candidate, userOptions)
      if (cache) {
        cache.set(key, result)
      }
    }
    results.push({ id: candidate.id, name: candidate.name, ...result })
    if (onProgress) {
      onProgress(i + 1, candidates.length)
    }
  }
  results.sort((p, q) => q.score - p.score)
  return results
}
