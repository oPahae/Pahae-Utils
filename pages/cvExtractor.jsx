import { useEffect, useRef, useState } from "react"
import { FileText, TriangleAlert, RotateCcw, Info } from "lucide-react"
import FileUploader from "../components/fileUploader.jsx"
import ProgressBar from "../components/progressBar.jsx"
import CvResult from "../components/cvResult.jsx"
import PhotoSelector from "../components/photoSelector.jsx"
import { validatePdfFile } from "../lib/imageProcessor.js"
import { openPdf, extractEmbeddedImages, rgbaToCanvas } from "../lib/pdfExtractor.js"

let idCounter = 0
const nextId = () => `p${++idCounter}`

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/build/pdf")
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"
  return pdfjs
}

function toField(source) {
  return { value: source.value || "", confidence: source.confidence || 0, source: source.source || "", edited: false, normalized: source.normalized || "" }
}

function toProject(project) {
  return {
    id: nextId(),
    name: project.name || "",
    description: project.description || "",
    period: project.period || "",
    technologiesText: (project.technologies || []).join(", "),
    confidence: project.confidence || 0,
    auto: true,
    edited: false
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export de l'image impossible"))), "image/png")
  })
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function CvExtractor() {
  const pdfRef = useRef(null)
  const [stage, setStage] = useState("idle")
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [data, setData] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [meta, setMeta] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [photo, setPhoto] = useState(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [projectsSectionFound, setProjectsSectionFound] = useState(false)

  useEffect(() => {
    return () => {
      if (pdfRef.current) {
        pdfRef.current.destroy()
      }
    }
  }, [])

  const reset = () => {
    if (pdfRef.current) {
      pdfRef.current.destroy()
      pdfRef.current = null
    }
    setStage("idle")
    setData(null)
    setCandidates([])
    setPhoto(null)
    setWarnings([])
    setMeta(null)
    setError("")
    setSelectorOpen(false)
  }

  const handleFiles = async ([file]) => {
    reset()
    setStage("working")
    setProgress(5)
    setProgressLabel("Validation du fichier")
    try {
      const check = await validatePdfFile(file)
      if (!check.ok) {
        throw new Error(check.error)
      }
      setFileName(check.name)
      const buffer = await file.arrayBuffer()
      setProgress(20)
      setProgressLabel("Analyse du texte sur le serveur")
      const response = await fetch("/api/extractCv", { method: "POST", headers: { "Content-Type": "application/pdf" }, body: buffer })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || `Le serveur a répondu avec le code ${response.status}.`)
      }
      setProgress(55)
      setProgressLabel("Recherche des images intégrées")
      const pdfjs = await loadPdfjs()
      const pdf = await openPdf(pdfjs, new Uint8Array(buffer.slice(0)))
      pdfRef.current = pdf
      const found = await extractEmbeddedImages(pdfjs, pdf, 3)
      setProgress(90)
      setProgressLabel("Évaluation des candidates")
      const shown = found
        .filter((c) => c.score > 0)
        .slice(0, 6)
        .map((c) => {
          const canvas = rgbaToCanvas(c.rgba, c.nativeWidth, c.nativeHeight)
          return { id: c.id, score: c.score, reasons: c.reasons, width: c.nativeWidth, height: c.nativeHeight, canvas, previewUrl: canvas.toDataURL("image/png") }
        })
      const cv = payload.cv
      setData({
        firstName: toField(cv.firstName),
        lastName: toField(cv.lastName),
        email: toField(cv.email),
        phone: toField(cv.phone),
        bio: toField(cv.bio),
        projects: cv.projects.map(toProject)
      })
      setProjectsSectionFound(cv.projectsSectionFound)
      setWarnings(cv.warnings)
      setMeta(payload.meta)
      setCandidates(shown)
      if (shown.length > 0 && shown[0].score >= 0.7) {
        setPhoto({ canvas: shown[0].canvas, previewUrl: shown[0].previewUrl, width: shown[0].width, height: shown[0].height, source: "auto", candidateId: shown[0].id })
      }
      setProgress(100)
      setStage("done")
    } catch (failure) {
      setError(failure.message)
      setStage("error")
    }
  }

  const updateField = (key, value) => {
    setData((current) => ({ ...current, [key]: { ...current[key], value, edited: true } }))
  }

  const updateProject = (id, patch) => {
    setData((current) => ({
      ...current,
      projects: current.projects.map((p) => (p.id === id ? { ...p, ...patch, edited: true } : p))
    }))
  }

  const addProject = () => {
    setData((current) => ({
      ...current,
      projects: [...current.projects, { id: nextId(), name: "", description: "", period: "", technologiesText: "", confidence: 0, auto: false, edited: true }]
    }))
  }

  const removeProject = (id) => {
    setData((current) => ({ ...current, projects: current.projects.filter((p) => p.id !== id) }))
  }

  const selectCandidate = (candidate) => {
    setPhoto({ canvas: candidate.canvas, previewUrl: candidate.previewUrl, width: candidate.width, height: candidate.height, source: "candidate", candidateId: candidate.id })
  }

  const confirmManual = (canvas) => {
    setPhoto({ canvas, previewUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, source: "manual", candidateId: null })
    setSelectorOpen(false)
  }

  const downloadPhoto = async () => {
    try {
      const blob = await canvasToBlob(photo.canvas)
      triggerDownload(blob, "photoProfil.png")
    } catch (failure) {
      setError(failure.message)
    }
  }

  const downloadJson = () => {
    const payload = {
      firstName: data.firstName.value,
      lastName: data.lastName.value,
      email: data.email.value,
      phone: data.phone.value,
      bio: data.bio.value,
      photo: photo ? { source: photo.source, width: photo.width, height: photo.height, dataUrl: photo.previewUrl } : null,
      projects: data.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologiesText.split(",").map((t) => t.trim()).filter(Boolean),
        period: p.period
      })),
      extraction: {
        file: fileName,
        confidence: {
          firstName: data.firstName.edited ? "manuel" : data.firstName.confidence,
          lastName: data.lastName.edited ? "manuel" : data.lastName.confidence,
          email: data.email.edited ? "manuel" : data.email.confidence,
          phone: data.phone.edited ? "manuel" : data.phone.confidence,
          bio: data.bio.edited ? "manuel" : data.bio.confidence
        }
      }
    }
    triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "cvData.json")
  }

  return (
    <div className="animate-fadeUp">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">CV Extractor</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">
          Importez un CV au format PDF. Le texte est analysé par des règles déterministes, la photo est recherchée parmi les images intégrées du document.
        </p>
      </header>
      {stage !== "done" && (
        <div className="mx-auto max-w-2xl">
          <FileUploader
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            busy={stage === "working"}
            title="Glissez un CV PDF ici ou cliquez pour choisir un fichier"
            hint="PDF uniquement, 12 Mo maximum"
            icon={FileText}
          />
          {stage === "working" && (
            <div className="mt-5 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <ProgressBar value={progress} label={progressLabel} />
            </div>
          )}
          {stage === "error" && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
      {stage === "done" && data && (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
            <p className="flex items-center gap-2 text-sm text-ink-800">
              <FileText className="h-4 w-4 text-ink-600" aria-hidden="true" />
              <span className="font-medium">{fileName}</span>
              {meta && <span className="text-ink-500">{meta.pageCount} page(s)</span>}
            </p>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-800 transition hover:bg-ink-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Analyser un autre CV
            </button>
          </div>
          {warnings.map((warning) => (
            <div key={warning} role="status" className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{warning}</p>
            </div>
          ))}
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}
          {selectorOpen && pdfRef.current && (
            <div className="mb-5">
              <PhotoSelector pdf={pdfRef.current} pageCount={pdfRef.current.numPages} onConfirm={confirmManual} onCancel={() => setSelectorOpen(false)} />
            </div>
          )}
          <CvResult
            data={data}
            projectsSectionFound={projectsSectionFound}
            onField={updateField}
            onProject={updateProject}
            onAddProject={addProject}
            onRemoveProject={removeProject}
            onDownloadJson={downloadJson}
            photoProps={{
              photo,
              candidates,
              canSelect: Boolean(pdfRef.current),
              onSelectCandidate: selectCandidate,
              onOpenSelector: () => setSelectorOpen(true),
              onRemovePhoto: () => setPhoto(null),
              onDownloadPhoto: downloadPhoto
            }}
          />
        </div>
      )}
    </div>
  )
}
