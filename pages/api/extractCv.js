import path from "node:path"
import { createRequire } from "node:module"
import { analyzePdf, PdfReadError } from "../../lib/pdfExtractor.js"
import { parseCv } from "../../lib/cvParser.js"
import { MAX_PDF_BYTES, detectPdfSignature } from "../../lib/imageProcessor.js"

export const config = {
  api: {
    bodyParser: false
  }
}

const requireFromProject = createRequire(path.join(process.cwd(), "package.json"))
let pdfjsPromise = null

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.resolve().then(() => {
      const pdfjs = requireFromProject("pdfjs-dist/legacy/build/pdf.js")
      pdfjs.GlobalWorkerOptions.workerSrc = requireFromProject.resolve("pdfjs-dist/legacy/build/pdf.worker.js")
      return pdfjs
    })
  }
  return pdfjsPromise
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on("data", (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new RangeError("Fichier trop volumineux"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." })
  }
  const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase()
  if (contentType !== "application/pdf" && contentType !== "application/octet-stream") {
    return res.status(415).json({ error: "Type de contenu non pris en charge : envoyez le PDF brut (application/pdf)." })
  }
  let body
  try {
    body = await readBody(req, MAX_PDF_BYTES)
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(413).json({ error: `Le fichier dépasse ${Math.round(MAX_PDF_BYTES / 1048576)} Mo.` })
    }
    return res.status(400).json({ error: "Lecture de la requête impossible." })
  }
  if (body.length === 0) {
    return res.status(400).json({ error: "Le fichier est vide." })
  }
  if (!detectPdfSignature(body.subarray(0, 1032))) {
    return res.status(400).json({ error: "Le contenu n'est pas celui d'un PDF valide." })
  }
  try {
    const pdfjs = await loadPdfjs()
    const analysis = await analyzePdf(pdfjs, new Uint8Array(body), { images: false })
    const cv = parseCv(analysis)
    return res.status(200).json({
      cv,
      meta: { pageCount: analysis.pageCount, characters: analysis.characters, scanned: analysis.scanned }
    })
  } catch (error) {
    if (error instanceof PdfReadError) {
      return res.status(422).json({ error: error.message, code: error.code })
    }
    return res.status(500).json({ error: "Erreur interne pendant l'analyse du PDF." })
  }
}
