import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Check, X, LoaderCircle, Crop } from "lucide-react"
import { renderPage } from "../lib/pdfExtractor.js"

const MIN_SELECTION = 0.02

export default function PhotoSelector({ pdf, pageCount, onConfirm, onCancel }) {
  const canvasRef = useRef(null)
  const queueRef = useRef(Promise.resolve())
  const dragRef = useRef(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selection, setSelection] = useState(null)
  const [crop, setCrop] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    setSelection(null)
    setCrop(null)
    queueRef.current = queueRef.current
      .catch(() => {})
      .then(() => (cancelled ? null : renderPage(pdf, page, canvasRef.current, 1200)))
      .then(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
      .catch((renderError) => {
        if (!cancelled) {
          setError(`Impossible d'afficher la page : ${renderError.message}`)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pdf, page])

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    }
  }

  const handleDown = (event) => {
    if (loading || error) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    const start = pointFromEvent(event)
    dragRef.current = start
    setCrop(null)
    setSelection({ x: start.x, y: start.y, w: 0, h: 0 })
  }

  const handleMove = (event) => {
    if (!dragRef.current) {
      return
    }
    const start = dragRef.current
    const current = pointFromEvent(event)
    setSelection({
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      w: Math.abs(current.x - start.x),
      h: Math.abs(current.y - start.y)
    })
  }

  const handleUp = () => {
    if (!dragRef.current) {
      return
    }
    dragRef.current = null
    setSelection((current) => {
      if (!current || current.w < MIN_SELECTION || current.h < MIN_SELECTION) {
        setCrop(null)
        return null
      }
      const canvas = canvasRef.current
      const sx = Math.round(current.x * canvas.width)
      const sy = Math.round(current.y * canvas.height)
      const sw = Math.max(1, Math.min(canvas.width - sx, Math.round(current.w * canvas.width)))
      const sh = Math.max(1, Math.min(canvas.height - sy, Math.round(current.h * canvas.height)))
      const out = document.createElement("canvas")
      out.width = sw
      out.height = sh
      out.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
      setCrop({ canvas: out, url: out.toDataURL("image/png") })
      return current
    })
  }

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:p-5" aria-label="Sélection manuelle de la photo">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Crop className="h-4 w-4" aria-hidden="true" />
            Sélection manuelle de la photo
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">Tracez un rectangle autour de la photo sur la page du CV.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-ink-200 p-1.5 text-ink-700 hover:bg-ink-50 disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-xs font-medium text-ink-700">
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-ink-200 p-1.5 text-ink-700 hover:bg-ink-50 disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative mx-auto w-full max-w-[640px] select-none overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
          <canvas ref={canvasRef} className="block h-auto w-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <LoaderCircle className="h-6 w-6 animate-spin text-ink-700" aria-hidden="true" />
            </div>
          )}
          {error && <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-700">{error}</p>}
          <div
            className="absolute inset-0 cursor-crosshair touch-none"
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
          >
            {selection && (
              <span
                className="absolute border-2 border-ink-700 bg-ink-700/15"
                style={{
                  left: `${selection.x * 100}%`,
                  top: `${selection.y * 100}%`,
                  width: `${selection.w * 100}%`,
                  height: `${selection.h * 100}%`
                }}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 p-2">
            {crop ? (
              <img src={crop.url} alt="Aperçu de la zone sélectionnée" className="max-h-60 max-w-full rounded object-contain" />
            ) : (
              <p className="px-3 text-center text-xs text-ink-500">L'aperçu de la zone sélectionnée apparaîtra ici.</p>
            )}
          </div>
          <button
            type="button"
            disabled={!crop}
            onClick={() => onConfirm(crop.canvas)}
            className="flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Utiliser cette zone
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Fermer
          </button>
        </div>
      </div>
    </section>
  )
}
