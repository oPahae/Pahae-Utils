import { Download, FileJson, Plus, Trash2, UserRound, Crop, ImageOff, Mail, Phone, ScrollText, FolderGit2, Check } from "lucide-react"
import { confidenceLevel } from "../lib/cvParser.js"

const inputClass =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-100"

const levelStyles = {
  high: "bg-emerald-50 text-emerald-800",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-red-50 text-red-700"
}

const levelLabels = { high: "Confiance élevée", medium: "Confiance moyenne", low: "Confiance faible" }

export function ConfidenceBadge({ field }) {
  if (field.edited) {
    return <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">Modifié manuellement</span>
  }
  if (!field.value) {
    return <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-500">Non trouvé</span>
  }
  const level = confidenceLevel(field.confidence)
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${levelStyles[level]}`} title={`Méthode : ${field.source}`}>
      {levelLabels[level]} ({Math.round(field.confidence * 100)} %)
    </span>
  )
}

function Field({ label, field, onChange, multiline = false, type = "text", placeholder, rows = 5 }) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-ink-600">
          {label}
        </label>
        <ConfidenceBadge field={field} />
      </div>
      {multiline ? (
        <textarea id={id} rows={rows} value={field.value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y leading-relaxed`} />
      ) : (
        <input id={id} type={type} value={field.value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  )
}

function Card({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Icon className="h-4 w-4 text-ink-600" aria-hidden="true" />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function candidateLabel(score) {
  if (score >= 0.7) {
    return { text: "Photo probable", style: "bg-emerald-50 text-emerald-800" }
  }
  if (score >= 0.45) {
    return { text: "Candidate possible", style: "bg-amber-50 text-amber-800" }
  }
  return { text: "Peu probable", style: "bg-ink-50 text-ink-500" }
}

const photoMessages = {
  auto: "Image repérée automatiquement parmi les images intégrées du PDF. Il s'agit d'une estimation : vérifiez qu'il s'agit bien de la bonne image.",
  candidate: "Image choisie manuellement parmi les images intégrées du PDF.",
  manual: "Zone sélectionnée manuellement sur la page du CV."
}

function PhotoCard({ photo, candidates, onSelectCandidate, onOpenSelector, onRemovePhoto, onDownloadPhoto, canSelect }) {
  const hasProbable = candidates.some((c) => c.score >= 0.7)
  return (
    <Card title="Photo de profil" icon={UserRound}>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex w-full flex-col items-center gap-3 sm:w-44">
          <div className="flex h-52 w-40 items-center justify-center overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
            {photo ? (
              <img src={photo.previewUrl} alt="Photo de profil extraite" className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-8 w-8 text-ink-300" aria-hidden="true" />
            )}
          </div>
          {photo && (
            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={onDownloadPhoto}
                className="flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-ink-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Télécharger la photo
              </button>
              <button
                type="button"
                onClick={onRemovePhoto}
                className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Retirer
              </button>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-700">
            {photo
              ? `${photoMessages[photo.source]} (${photo.width} x ${photo.height} px)`
              : hasProbable
                ? "Aucune photo sélectionnée."
                : "Aucune image du PDF n'a pu être identifiée comme photo de profil avec certitude. Choisissez une image candidate ou sélectionnez la zone manuellement."}
          </p>
          {candidates.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-600">Images intégrées dans le PDF</p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {candidates.map((candidate) => {
                  const label = candidateLabel(candidate.score)
                  const selected = photo && photo.candidateId === candidate.id
                  return (
                    <li key={candidate.id} className={`rounded-xl border p-2 ${selected ? "border-ink-700 ring-1 ring-ink-700" : "border-ink-100"}`}>
                      <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-ink-50">
                        <img src={candidate.previewUrl} alt="Image candidate" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${label.style}`} title={candidate.reasons.join(". ")}>
                          {label.text}
                        </span>
                        <span className="text-[10px] tabular-nums text-ink-500">{Math.round(candidate.score * 100)} %</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(candidate)}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-[11px] font-medium text-ink-700 transition hover:bg-ink-50"
                      >
                        {selected ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                        {selected ? "Sélectionnée" : "Utiliser"}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {canSelect && (
            <button
              type="button"
              onClick={onOpenSelector}
              className="mt-4 flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
            >
              <Crop className="h-4 w-4" aria-hidden="true" />
              Sélectionner la photo manuellement sur la page
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function CvResult({ data, onField, onProject, onAddProject, onRemoveProject, photoProps, onDownloadJson, projectsSectionFound }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Identité" icon={UserRound}>
          <div className="flex flex-col gap-4">
            <Field label="Prénom" field={data.firstName} onChange={(v) => onField("firstName", v)} placeholder="Non détecté" />
            <Field label="Nom" field={data.lastName} onChange={(v) => onField("lastName", v)} placeholder="Non détecté" />
          </div>
        </Card>
        <Card title="Coordonnées" icon={Mail}>
          <div className="flex flex-col gap-4">
            <Field label="Adresse email" field={data.email} type="email" onChange={(v) => onField("email", v)} placeholder="Non détectée" />
            <Field label="Téléphone" field={data.phone} type="tel" onChange={(v) => onField("phone", v)} placeholder="Non détecté" />
          </div>
          {data.phone.normalized && !data.phone.edited && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              Format normalisé : {data.phone.normalized}
            </p>
          )}
        </Card>
      </div>
      <PhotoCard {...photoProps} />
      <Card title="Biographie" icon={ScrollText}>
        <Field label="Résumé professionnel" field={data.bio} multiline rows={6} onChange={(v) => onField("bio", v)} placeholder="Aucun résumé détecté" />
      </Card>
      <Card
        title={`Projets (${data.projects.length})`}
        icon={FolderGit2}
        action={
          <button
            type="button"
            onClick={onAddProject}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-800 transition hover:bg-ink-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Ajouter un projet
          </button>
        }
      >
        {data.projects.length === 0 && (
          <p className="text-sm text-ink-500">
            {projectsSectionFound ? "La section de projets n'a pas pu être découpée en projets." : "Aucune section de projets identifiée."} Vous pouvez ajouter les projets manuellement.
          </p>
        )}
        <ul className="flex flex-col gap-4">
          {data.projects.map((project, index) => {
            const level = confidenceLevel(project.confidence)
            return (
              <li key={project.id} className="rounded-xl border border-ink-100 bg-ink-50/40 p-4 animate-fadeUp">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-600">Projet {index + 1}</span>
                  <div className="flex items-center gap-2">
                    {project.auto && !project.edited && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${levelStyles[level]}`}>
                        {levelLabels[level]} ({Math.round(project.confidence * 100)} %)
                      </span>
                    )}
                    {project.edited && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">Modifié manuellement</span>}
                    <button
                      type="button"
                      onClick={() => onRemoveProject(project.id)}
                      className="rounded-lg p-1.5 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Supprimer le projet ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={project.name}
                    onChange={(e) => onProject(project.id, { name: e.target.value })}
                    placeholder="Nom du projet"
                    aria-label={`Nom du projet ${index + 1}`}
                    className={inputClass}
                  />
                  <input
                    value={project.period}
                    onChange={(e) => onProject(project.id, { period: e.target.value })}
                    placeholder="Date ou période"
                    aria-label={`Période du projet ${index + 1}`}
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={project.description}
                  rows={3}
                  onChange={(e) => onProject(project.id, { description: e.target.value })}
                  placeholder="Description"
                  aria-label={`Description du projet ${index + 1}`}
                  className={`${inputClass} mt-3 resize-y leading-relaxed`}
                />
                <input
                  value={project.technologiesText}
                  onChange={(e) => onProject(project.id, { technologiesText: e.target.value })}
                  placeholder="Technologies (séparées par des virgules)"
                  aria-label={`Technologies du projet ${index + 1}`}
                  className={`${inputClass} mt-3`}
                />
              </li>
            )
          })}
        </ul>
      </Card>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDownloadJson}
          className="flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-card transition hover:bg-ink-800"
        >
          <FileJson className="h-4 w-4" aria-hidden="true" />
          Télécharger les données (JSON)
        </button>
      </div>
    </div>
  )
}
