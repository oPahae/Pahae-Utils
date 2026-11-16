import { buildRepresentation } from "./imageProcessor.js"
import { searchSimilar } from "./similarity.js"

const representations = new Map()
const pairCache = new Map()

function forget(id) {
  representations.delete(id)
  for (const key of [...pairCache.keys()]) {
    const [a, b] = key.split("|")
    if (a === id || b === id) {
      pairCache.delete(key)
    }
  }
}

self.onmessage = (event) => {
  const message = event.data
  try {
    if (message.type === "add") {
      const rep = buildRepresentation({
        id: message.id,
        name: message.name,
        width: message.width,
        height: message.height,
        rgba: new Uint8ClampedArray(message.buffer)
      })
      representations.set(message.id, rep)
      self.postMessage({
        type: "added",
        requestId: message.requestId,
        id: message.id,
        levels: rep.levels.map((level) => [level.width, level.height])
      })
    } else if (message.type === "remove") {
      forget(message.id)
      self.postMessage({ type: "removed", requestId: message.requestId, id: message.id })
    } else if (message.type === "search") {
      const reference = representations.get(message.referenceId)
      if (!reference) {
        throw new Error("Image de référence introuvable dans le worker")
      }
      const candidates = message.candidateIds.map((id) => representations.get(id)).filter(Boolean)
      const started = performance.now()
      const results = searchSimilar(
        reference,
        candidates,
        {},
        (done, total) => {
          self.postMessage({ type: "progress", requestId: message.requestId, done, total })
        },
        pairCache
      )
      self.postMessage({ type: "results", requestId: message.requestId, results, elapsedMs: Math.round(performance.now() - started) })
    } else if (message.type === "clear") {
      representations.clear()
      pairCache.clear()
      self.postMessage({ type: "cleared", requestId: message.requestId })
    }
  } catch (error) {
    self.postMessage({ type: "error", requestId: message.requestId, message: error && error.message ? error.message : String(error) })
  }
}
