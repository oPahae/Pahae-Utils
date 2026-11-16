import Link from "next/link"
import { FileUser, Images, ArrowRight, ShieldCheck, Cpu, ScanSearch, Sigma } from "lucide-react"

const tools = [
  {
    href: "/cvExtractor",
    icon: FileUser,
    title: "CV Extractor",
    text: "Importez un CV au format PDF et récupérez le nom, le prénom, l'email, le téléphone, la biographie, les projets et la photo, avec un indice de confiance par champ.",
    points: ["Règles déterministes et expressions régulières", "Photo repérée parmi les images intégrées du PDF", "Sélection manuelle de secours sur la page"]
  },
  {
    href: "/imageSearch",
    icon: Images,
    title: "Image Search",
    text: "Comparez une image de référence à une galerie. Le moteur retrouve les copies, les versions redimensionnées et les images contenues dans d'autres images.",
    points: ["Pixels encodés par la fonction de Cantor", "Recherche multi-échelle de sous-images", "Zone correspondante mise en évidence"]
  }
]

const principles = [
  { icon: ShieldCheck, title: "Traitement local", text: "Aucun service externe, aucune clé API." },
  { icon: Cpu, title: "Sans intelligence artificielle", text: "Algorithmes classiques et heuristiques." },
  { icon: ScanSearch, title: "Résultats vérifiables", text: "Scores, confiances et limites affichés." },
  { icon: Sigma, title: "Cantor", text: "Représentation numérique exacte des pixels." }
]

export default function Home() {
  return (
    <div className="animate-fadeUp">
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-card">
          <Sigma className="h-3.5 w-3.5" aria-hidden="true" />
          Extraction de documents et traitement d'images
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">CV Extractor et moteur de similarité d'images</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-600">
          Deux outils qui fonctionnent entièrement dans votre navigateur et sur le serveur Next.js local, sans modèle pré-entraîné ni API externe.
        </p>
      </section>
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        {tools.map(({ href, icon: Icon, title, text, points }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-ink-300"
          >
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 text-white">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-semibold text-ink-950">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{text}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-700">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-500" />
                  {point}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-900">
              Ouvrir l'outil
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>
      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {principles.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-ink-100 bg-white p-4">
            <Icon className="mb-3 h-5 w-5 text-ink-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
