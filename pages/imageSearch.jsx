import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Images, Search, TriangleAlert, Trash2, SlidersHorizontal, SearchX } from "lucide-react"
import FileUploader from "../components/fileUploader.jsx"
import ImageGallery from "../components/imageGallery.jsx"
import MatchCard from "../components/matchCard.jsx"
import ProgressBar from "../components/progressBar.jsx"
import { validateImageFile, loadImageData } from "../lib/imageProcessor.js"

let counter = 0
const nextId = () => `img${++counter}`

export default function ImageSearch() {
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())
  const urlsRef = useRef(new Map())
  const [items, setItems] = useState([])
  const [referenceId, setReferenceId] = useState(null)
  const [errors, setErrors] = useState([])
  const [loadingCount, setLoadingCount] = useState(0)
  const [searching, setSearching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [threshold, setThreshold] = useState(60)

  useEffect(() => {
    const worker = new Worker(new URL("../lib/imageWorker.js", import.meta.url), { type: "module" })
    worker.onmessage = (event) => {
      const message = event.data
      const pending = pendingRef.current.get(message.requestId)
      if (!pending) {
        return
      }
      if (message.type === "progress") {
        pending.onProgress?.(message.done, message.total)
        return
      }
      pendingRef.current.delete(message.requestId)
      if (message.type === "error") {
        pending.reject(new Error(message.message))
      } else {
        pending.resolve(message)
      }
    }
    worker.onerror = (event) => {
      const failure = new Error(event.message || "Erreur du worker de traitement d'images")
      for (const pending of pendingRef.current.values()) {
        pending.reject(failure)
      }
      pendingRef.current.clear()
    }
    workerRef.current = worker
    const urls = urlsRef.current
    return () => {
      worker.terminate()
      for (const url of urls.values()) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  const call = useCallback((payload, transfer = [], onProgress) => {
    return new Promise((resolve, reject) => {
      const requestId = nextId()
      pendingRef.current.set(requestId, { resolve, reject, onProgress })
      workerRef.current.postMessage({ ...payload, requestId }, transfer)
    })
  }, [])

  const handleFiles = async (files) => {
    const newErrors = []
    setLoadingCount((n) => n + files.length)
    for (const file of files) {
      const check = await validateImageFile(file)
      if (!check.ok) {
        newErrors.push(check.error)
        setLoadingCount((n) => n - 1)
        continue
      }
      const id = nextId()
      const url = URL.createObjectURL(file)
      urlsRef.current.set(id, url)
      setItems((current) => [...current, { id, name: check.name, url, status: "loading" }])
      try {
        const decoded = await loadImageData(file, 640)
        await call(
          { type: "add", id, name: check.name, width: decoded.width, height: decoded.height, buffer: decoded.data.buffer },
          [decoded.data.buffer]
        )
        setItems((current) => current.map((it) => (it.id === id ? { ...it, status: "ready", originalWidth: decoded.originalWidth, originalHeight: decoded.originalHeight } : it)))
        setReferenceId((current) => current || id)
      } catch (failure) {
        setItems((current) => current.map((it) => (it.id === id ? { ...it, status: "error", error: "Image illisible" } : it)))
        newErrors.push(`${check.name} : ${failure.message}`)
      }
      setLoadingCount((n) => n - 1)
    }
    setResults(null)
    if (newErrors.length > 0) {
      setErrors(newErrors)
    } else {
      setErrors([])
    }
  }

  const removeItem = async (id) => {
    const url = urlsRef.current.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      urlsRef.current.delete(id)
    }
    try {
      await call({ type: "remove", id })
    } catch (failure) {
      setErrors([failure.message])
    }
    setItems((current) => {
      const rest = current.filter((it) => it.id !== id)
      setReferenceId((ref) => (ref === id ? rest.find((it) => it.status === "ready")?.id || null : ref))
      return rest
    })
    setResults(null)
  }

  const clearAll = async () => {
    for (const url of urlsRef.current.values()) {
      URL.revokeObjectURL(url)
    }
    urlsRef.current.clear()
    try {
      await call({ type: "clear" })
    } catch (failure) {
      setErrors([failure.message])
    }
    setItems([])
    setReferenceId(null)
    setResults(null)
  }

  const readyItems = items.filter((it) => it.status === "ready")
  const canSearch = referenceId && readyItems.length >= 2 && !searching && loadingCount === 0

  const runSearch = async () => {
    setSearching(true)
    setProgress(0)
    setErrors([])
    try {
      const candidateIds = readyItems.filter((it) => it.id !== referenceId).map((it) => it.id)
      const message = await call({ type: "search", referenceId, candidateIds }, [], (done, total) => setProgress((done / total) * 100))
      setResults(message.results)
      setElapsed(message.elapsedMs)
    } catch (failure) {
      setErrors([failure.message])
    }
    setSearching(false)
  }

  const itemById = useMemo(() => new Map(items.map((it) => [it.id, it])), [items])
  const reference = itemById.get(referenceId)
  const visible = results ? results.filter((r) => r.score * 100 >= threshold && r.kind !== "none") : []

  return (
    <div className="animate-fadeUp">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Image Search</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">
          Importez plusieurs images, choisissez une référence et lancez la recherche. Les images identiques, redimensionnées ou contenues les unes dans les autres sont détectées.
        </p>
      </header>
      <FileUploader
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp"
        multiple
        onFiles={handleFiles}
        busy={loadingCount > 0}
        title="Glissez des images ici ou cliquez pour les choisir"
        hint="PNG, JPEG, WebP, GIF ou BMP, 15 Mo maximum par image"
        icon={Images}
      />
      {errors.length > 0 && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="mb-1 flex items-center gap-2 font-medium">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            Certains fichiers n'ont pas pu être traités
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {items.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink-900">
              Galerie ({items.length}) <span className="font-normal text-ink-500">Cliquez sur une image pour la choisir comme référence</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAll}
                disabled={searching}
                className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Tout supprimer
              </button>
              <button
                type="button"
                onClick={runSearch}
                disabled={!canSearch}
                className="flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-card transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Lancer la recherche
              </button>
            </div>
          </div>
          <ImageGallery items={items} referenceId={referenceId} onSelectReference={setReferenceId} onRemove={removeItem} disabled={searching} />
          {readyItems.length < 2 && <p className="mt-3 text-xs text-ink-500">Importez au moins deux images pour lancer une recherche.</p>}
        </section>
      )}
      {searching && (
        <div className="mt-6 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <ProgressBar value={progress} label="Comparaison des images" />
        </div>
      )}
      {results && reference && !searching && (
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-950">Résultats</h2>
              <p className="text-xs text-ink-500">
                {visible.length} résultat(s) sur {results.length} image(s) comparée(s) en {(elapsed / 1000).toFixed(1)} s
              </p>
            </div>
            <label className="flex w-full max-w-xs flex-col gap-1.5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
              <span className="flex items-center justify-between text-xs font-medium text-ink-700">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  Seuil de similarité
                </span>
                <span className="tabular-nums">{threshold} %</span>
              </span>
              <input type="range" min={0} max={100} step={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="accent-ink-800" />
            </label>
          </div>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
              <SearchX className="mb-3 h-8 w-8 text-ink-400" aria-hidden="true" />
              <p className="text-sm font-medium text-ink-800">Aucune image ne dépasse le seuil de {threshold} %</p>
              <p className="mt-1 text-xs text-ink-500">Abaissez le seuil pour afficher des correspondances plus faibles.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visible.map((result) => (
                <MatchCard key={result.id} reference={reference} candidate={itemById.get(result.id)} result={result} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
