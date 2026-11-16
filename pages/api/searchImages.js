import { buildRepresentation } from "../../lib/imageProcessor.js"
import { searchSimilar } from "../../lib/similarity.js"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb"
    }
  }
}

const MAX_IMAGES = 24
const MAX_SIDE = 400

function decodeImage(entry, index) {
  if (!entry || typeof entry !== "object") {
    throw new TypeError(`Image ${index + 1} invalide`)
  }
  const { id, name, width, height, rgb } = entry
  if (typeof id !== "string" || id.length === 0 || id.length > 64 || id.includes("|")) {
    throw new TypeError(`Identifiant de l'image ${index + 1} invalide`)
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE) {
    throw new RangeError(`Dimensions de l'image ${index + 1} hors limites (maximum ${MAX_SIDE} px)`)
  }
  if (typeof rgb !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(rgb)) {
    throw new TypeError(`Données de l'image ${index + 1} invalides`)
  }
  const bytes = Buffer.from(rgb, "base64")
  if (bytes.length !== width * height * 3) {
    throw new RangeError(`Les données de l'image ${index + 1} ne correspondent pas à ses dimensions`)
  }
  return buildRepresentation({
    id,
    name: typeof name === "string" ? name.slice(0, 120) : id,
    width,
    height,
    rgb: new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.length)
  })
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." })
  }
  const body = req.body
  if (!body || typeof body !== "object" || !body.reference || !Array.isArray(body.candidates)) {
    return res.status(400).json({ error: "Corps de requête invalide : reference et candidates sont requis." })
  }
  if (body.candidates.length === 0) {
    return res.status(400).json({ error: "Aucune image à comparer." })
  }
  if (body.candidates.length + 1 > MAX_IMAGES) {
    return res.status(413).json({ error: `Trop d'images : ${MAX_IMAGES} au maximum par requête.` })
  }
  try {
    const started = Date.now()
    const reference = decodeImage(body.reference, 0)
    const candidates = body.candidates.map((entry, index) => decodeImage(entry, index + 1))
    const results = searchSimilar(reference, candidates)
    return res.status(200).json({ results, elapsedMs: Date.now() - started })
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return res.status(400).json({ error: error.message })
    }
    return res.status(500).json({ error: "Erreur interne pendant la comparaison des images." })
  }
}
