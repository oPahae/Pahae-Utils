import { ArrowLeftRight, Equal, Crop } from "lucide-react"

const kindLabels = {
  exact: "Identique (codes de Cantor égaux)",
  full: "Correspondance complète",
  partial: "Correspondance partielle"
}

function Frame({ item, region, label }) {
  return (
    <figure className="min-w-0 flex-1">
      <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-ink-100 bg-ink-50 align-top">
        <img src={item.url} alt={item.name} className="block max-h-56 max-w-full object-contain" draggable={false} />
        {region && (
          <span
            className="pointer-events-none absolute border-2 border-ink-800 bg-ink-800/15 shadow-[0_0_0_9999px_rgba(255,255,255,0.45)]"
            style={{
              left: `${region.x * 100}%`,
              top: `${region.y * 100}%`,
              width: `${region.w * 100}%`,
              height: `${region.h * 100}%`
            }}
          />
        )}
      </div>
      <figcaption className="mt-1.5 truncate text-xs text-ink-600" title={item.name}>
        {label} : {item.name}
      </figcaption>
    </figure>
  )
}

export default function MatchCard({ reference, candidate, result }) {
  const percent = Math.round(result.score * 1000) / 10
  const partial = result.kind === "partial"
  const regionOnReference = partial && result.containerId === reference.id ? result.region : null
  const regionOnCandidate = partial && result.containerId === candidate.id ? result.region : null
  const Icon = partial ? Crop : result.kind === "exact" ? Equal : ArrowLeftRight
  let detail = ""
  if (partial) {
    detail = result.containerId === reference.id ? "L'image candidate correspond à la zone surlignée de la référence." : "La référence correspond à la zone surlignée de l'image candidate."
  }

  return (
    <article className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card animate-fadeUp">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            partial ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {kindLabels[result.kind] || "Correspondance"}
        </span>
        <span className="text-lg font-semibold tabular-nums text-ink-900">{percent.toFixed(1)} %</span>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Frame item={reference} region={regionOnReference} label="Référence" />
        <Frame item={candidate} region={regionOnCandidate} label="Candidate" />
      </div>
      {detail && <p className="mt-3 text-xs text-ink-600">{detail}</p>}
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-ink-500">
        <div className="rounded-lg bg-ink-50 px-2 py-1.5">
          <dt>Structure</dt>
          <dd className="text-sm font-semibold text-ink-900">{Math.round(result.metrics.structural * 100)} %</dd>
        </div>
        <div className="rounded-lg bg-ink-50 px-2 py-1.5">
          <dt>Couleurs</dt>
          <dd className="text-sm font-semibold text-ink-900">{Math.round(result.metrics.photometric * 100)} %</dd>
        </div>
        <div className="rounded-lg bg-ink-50 px-2 py-1.5">
          <dt>Histogramme</dt>
          <dd className="text-sm font-semibold text-ink-900">{Math.round(result.metrics.histogram * 100)} %</dd>
        </div>
      </dl>
    </article>
  )
}
