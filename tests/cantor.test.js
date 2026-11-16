import test from "node:test"
import assert from "node:assert/strict"
import {
  cantor,
  cantorReverse,
  cantorBig,
  cantorReverseBig,
  encodePixel,
  decodePixel,
  encodePixelBig,
  decodePixelBig,
  MAX_ENCODED_PIXEL
} from "../lib/cantor.js"
import { mulberry32 } from "./helpers.js"

test("cantor puis cantorReverse restitue les couples d'origine (valeurs limites)", () => {
  const values = [0, 1, 2, 254, 255, 256, 1000, 130560]
  for (const x of values) {
    for (const y of values) {
      assert.deepEqual(cantorReverse(cantor(x, y)), [x, y])
    }
  }
})

test("cantor puis cantorReverse sur plusieurs milliers de couples aléatoires", () => {
  const rand = mulberry32(42)
  for (let i = 0; i < 5000; i++) {
    const x = Math.floor(rand() * 130561)
    const y = Math.floor(rand() * 130561)
    assert.deepEqual(cantorReverse(cantor(x, y)), [x, y])
  }
})

test("encodage et décodage de pixels RGB : valeurs limites 0 et 255", () => {
  const limits = [0, 255]
  for (const r of limits) {
    for (const g of limits) {
      for (const b of limits) {
        assert.deepEqual(decodePixel(encodePixel(r, g, b)), [r, g, b])
      }
    }
  }
  assert.equal(encodePixel(0, 0, 0), 0)
  assert.equal(encodePixel(255, 255, 255), MAX_ENCODED_PIXEL)
})

test("encodage et décodage de pixels RGB : 800 combinaisons aléatoires", () => {
  const rand = mulberry32(7)
  for (let i = 0; i < 800; i++) {
    const r = Math.floor(rand() * 256)
    const g = Math.floor(rand() * 256)
    const b = Math.floor(rand() * 256)
    assert.deepEqual(decodePixel(encodePixel(r, g, b)), [r, g, b])
  }
})

test("encodage et décodage exhaustifs des 16 777 216 couleurs RGB", () => {
  let checked = 0
  for (let r = 0; r < 256; r++) {
    for (let g = 0; g < 256; g++) {
      for (let b = 0; b < 256; b++) {
        const z = encodePixel(r, g, b)
        const [dr, dg, db] = decodePixel(z)
        if (dr !== r || dg !== g || db !== b) {
          assert.fail(`Échec pour ${r},${g},${b}`)
        }
        checked++
      }
    }
  }
  assert.equal(checked, 256 * 256 * 256)
})

test("la valeur maximale encodée reste un entier sûr de Number", () => {
  assert.ok(Number.isSafeInteger(MAX_ENCODED_PIXEL))
  assert.ok(MAX_ENCODED_PIXEL < Number.MAX_SAFE_INTEGER / 1e5)
})

test("la version BigInt est identique à la version Number sur le domaine RGB", () => {
  const rand = mulberry32(99)
  for (let i = 0; i < 2000; i++) {
    const r = Math.floor(rand() * 256)
    const g = Math.floor(rand() * 256)
    const b = Math.floor(rand() * 256)
    assert.equal(Number(encodePixelBig(r, g, b)), encodePixel(r, g, b))
    assert.deepEqual(decodePixelBig(encodePixelBig(r, g, b)), [r, g, b])
  }
})

test("BigInt : aller-retour exact sur de très grands entiers", () => {
  const big = [0n, 1n, 2n ** 40n, 2n ** 53n + 12345n, 2n ** 80n + 99999n, 123456789012345678901234567890n]
  for (const x of big) {
    for (const y of big) {
      const [rx, ry] = cantorReverseBig(cantorBig(x, y))
      assert.equal(rx, x)
      assert.equal(ry, y)
    }
  }
})
