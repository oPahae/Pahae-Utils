import test from "node:test"
import assert from "node:assert/strict"
import { compareRepresentations, searchSimilar, exactMatchRatio } from "../lib/similarity.js"
import { decodeToPlanes } from "../lib/cantor.js"
import { buildRepresentation, compositeOnWhite } from "../lib/imageProcessor.js"
import {
  makeScene,
  scaleCanvas,
  cropCanvas,
  adjustCanvas,
  addNoise,
  shuffleTiles,
  toRepresentation,
  regionOverlap
} from "./helpers.js"

const sceneA = makeScene(1)
const sceneOther = makeScene(2)
const repA = toRepresentation(sceneA, "A")

function report(label, result) {
  const region = result.region ? ` region=${["x", "y", "w", "h"].map((k) => result.region[k].toFixed(2)).join("/")}` : ""
  console.log(`  ${label.padEnd(46)} score=${(result.score * 100).toFixed(1).padStart(5)}%  ${result.kind}${region}`)
}

test("1. images identiques : correspondance exacte par comparaison des codes de Cantor", () => {
  const copy = toRepresentation(adjustCanvas(sceneA, (r, g, b) => [r, g, b]), "copy")
  const result = compareRepresentations(repA, copy)
  report("identiques", result)
  assert.equal(result.kind, "exact")
  assert.equal(result.score, 1)
  assert.equal(exactMatchRatio(repA, copy), 1)
})

test("2. images presque identiques (bruit léger)", () => {
  const noisy = toRepresentation(addNoise(sceneA, 6, 5), "noisy")
  const result = compareRepresentations(repA, noisy)
  report("presque identiques (bruit +-6)", result)
  assert.ok(result.score >= 0.9, `score ${result.score}`)
  assert.equal(result.kind, "full")
  assert.ok(exactMatchRatio(repA, noisy) < 1)
})

test("3. image redimensionnée (réduction et agrandissement)", () => {
  for (const [w, h] of [[320, 240], [160, 120], [900, 675]]) {
    const resized = toRepresentation(scaleCanvas(sceneA, w, h), `resized${w}`)
    const result = compareRepresentations(repA, resized)
    report(`redimensionnée ${w}x${h}`, result)
    assert.ok(result.score >= 0.9, `${w}x${h} score ${result.score}`)
    assert.equal(result.kind, "full")
  }
})

test("4. luminosité et couleurs légèrement différentes", () => {
  const brighter = toRepresentation(adjustCanvas(sceneA, (r, g, b) => [r + 18, g + 18, b + 18]), "brighter")
  const darker = toRepresentation(adjustCanvas(sceneA, (r, g, b) => [r * 0.9, g * 0.9, b * 0.9]), "darker")
  const tinted = toRepresentation(adjustCanvas(sceneA, (r, g, b) => [r + 10, g, b - 10]), "tinted")
  for (const [label, rep] of [["plus lumineuse (+18)", brighter], ["plus sombre (x0.9)", darker], ["teinte légèrement modifiée", tinted]]) {
    const result = compareRepresentations(repA, rep)
    report(label, result)
    assert.ok(result.score >= 0.85, `${label} score ${result.score}`)
    assert.equal(result.kind, "full")
  }
})

test("5. petite image entièrement contenue dans une grande image (même résolution)", () => {
  const expected = { x: 200 / 640, y: 100 / 480, w: 240 / 640, h: 180 / 480 }
  const small = toRepresentation(cropCanvas(sceneA, 200, 100, 240, 180), "crop")
  const direct = compareRepresentations(small, repA)
  const reverse = compareRepresentations(repA, small)
  report("recadrage 240x180 (petite, grande)", direct)
  report("recadrage 240x180 (grande, petite)", reverse)
  for (const result of [direct, reverse]) {
    assert.equal(result.kind, "partial")
    assert.ok(result.score >= 0.9, `score ${result.score}`)
    assert.equal(result.containerId, "A")
    assert.equal(result.containedId, "crop")
    assert.ok(regionOverlap(result.region, expected) > 0.8, `région ${JSON.stringify(result.region)}`)
  }
})

test("6. petite image contenue dans une grande image avec une résolution différente", () => {
  const expected = { x: 150 / 640, y: 220 / 480, w: 300 / 640, h: 225 / 480 }
  const cases = [
    ["réduite à 150x113", scaleCanvas(cropCanvas(sceneA, 150, 220, 300, 225), 150, 113)],
    ["réduite à 100x75", scaleCanvas(cropCanvas(sceneA, 150, 220, 300, 225), 100, 75)],
    ["agrandie à 450x338", scaleCanvas(cropCanvas(sceneA, 150, 220, 300, 225), 450, 338)]
  ]
  for (const [label, canvas] of cases) {
    const rep = toRepresentation(canvas, "crop")
    const result = compareRepresentations(rep, repA)
    report(`recadrage 300x225 ${label}`, result)
    assert.equal(result.kind, "partial")
    assert.ok(result.score >= 0.8, `${label} score ${result.score}`)
    assert.ok(regionOverlap(result.region, expected) > 0.75, `${label} région ${JSON.stringify(result.region)}`)
  }
})

test("6b. petit recadrage de petite taille (environ 15 pour cent de la largeur) avec changement de luminosité", () => {
  const expected = { x: 400 / 640, y: 60 / 480, w: 100 / 640, h: 75 / 480 }
  const canvas = adjustCanvas(scaleCanvas(cropCanvas(sceneA, 400, 60, 100, 75), 200, 150), (r, g, b) => [r + 12, g + 12, b + 12])
  const result = compareRepresentations(toRepresentation(canvas, "tiny"), repA)
  report("recadrage 100x75 agrandi 200x150 +12", result)
  assert.equal(result.kind, "partial")
  assert.ok(result.score >= 0.75, `score ${result.score}`)
  assert.ok(regionOverlap(result.region, expected) > 0.6, `région ${JSON.stringify(result.region)}`)
})

test("7. images totalement différentes", () => {
  const other = toRepresentation(sceneOther, "other")
  const result = compareRepresentations(repA, other)
  report("scènes différentes", result)
  assert.ok(result.score < 0.35, `score ${result.score}`)
  const third = toRepresentation(makeScene(3, 500, 500), "third")
  const second = compareRepresentations(third, repA)
  report("scènes différentes de tailles différentes", second)
  assert.ok(second.score < 0.35, `score ${second.score}`)
})

test("8. mêmes couleurs, arrangements spatiaux différents", () => {
  const shuffled = toRepresentation(shuffleTiles(sceneA, 8, 6, 11), "shuffled")
  const result = compareRepresentations(repA, shuffled)
  report("tuiles mélangées (histogramme identique)", result)
  assert.ok(result.score < 0.5, `score ${result.score}`)
  const sorted = toRepresentation(shuffleTiles(sceneA, 2, 2, 3), "quadrants")
  const second = compareRepresentations(repA, sorted)
  report("quadrants permutés", second)
  assert.ok(second.score < 0.6, `score ${second.score}`)
})

test("9. recherche triée du plus au moins similaire", () => {
  const candidates = [
    toRepresentation(sceneOther, "different"),
    toRepresentation(cropCanvas(sceneA, 300, 200, 200, 150), "contained"),
    toRepresentation(addNoise(sceneA, 5, 8), "near"),
    toRepresentation(shuffleTiles(sceneA, 8, 6, 4), "shuffled")
  ]
  const results = searchSimilar(repA, candidates)
  console.log("  classement :", results.map((r) => `${r.id}=${(r.score * 100).toFixed(0)}%`).join("  "))
  assert.deepEqual(results.slice(0, 2).map((r) => r.id).sort(), ["contained", "near"])
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i - 1].score >= results[i].score)
  }
  assert.ok(results[2].score < 0.5 && results[3].score < 0.5)
})

test("10. transparence composée sur fond blanc et décodage des vecteurs Cantor", () => {
  const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 0, 10, 20, 30, 128, 0, 0, 0, 255])
  const rgb = compositeOnWhite(rgba, 4)
  assert.deepEqual(Array.from(rgb.slice(0, 3)), [255, 0, 0])
  assert.deepEqual(Array.from(rgb.slice(3, 6)), [255, 255, 255])
  assert.equal(rgb[6], 132)
  const rep = buildRepresentation({ id: "t", name: "t", width: 2, height: 2, rgba })
  const planes = decodeToPlanes(rep.levels[0].encoded)
  assert.deepEqual(Array.from(planes.r), [255, 255, 132, 0])
  assert.deepEqual(Array.from(planes.b), [0, 255, 142, 0])
})
