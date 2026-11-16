import { Trash2, Check, LoaderCircle, TriangleAlert } from "lucide-react"

export default function ImageGallery({ items, referenceId, onSelectReference, onRemove, disabled }) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const isReference = item.id === referenceId
        return (
          <li
            key={item.id}
            className={`group relative overflow-hidden rounded-xl border bg-white shadow-card transition-all animate-fadeUp ${
              isReference ? "border-ink-700 ring-2 ring-ink-700" : "border-ink-100"
            }`}
          >
            <button
              type="button"
              disabled={disabled || item.status !== "ready"}
              onClick={() => onSelectReference(item.id)}
              className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500"
              aria-pressed={isReference}
              aria-label={`Choisir ${item.name} comme image de référence`}
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-ink-50">
                <img src={item.url} alt={item.name} className="h-full w-full object-contain" draggable={false} />
                {item.status === "loading" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <LoaderCircle className="h-6 w-6 animate-spin text-ink-700" aria-hidden="true" />
                  </span>
                )}
                {item.status === "error" && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/90 px-2 text-center text-xs text-red-700">
                    <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                    {item.error}
                  </span>
                )}
              </div>
              <div className="px-3 py-2">
                <p className="truncate text-xs font-medium text-ink-900" title={item.name}>
                  {item.name}
                </p>
                <p className="text-[11px] text-ink-500">
                  {item.originalWidth ? `${item.originalWidth} x ${item.originalHeight} px` : "Chargement"}
                </p>
              </div>
            </button>
            {isReference && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink-800 px-2 py-0.5 text-[11px] font-medium text-white">
                <Check className="h-3 w-3" aria-hidden="true" />
                Référence
              </span>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-ink-600 opacity-100 shadow-sm transition hover:bg-white hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              aria-label={`Supprimer ${item.name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
