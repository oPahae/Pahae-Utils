import Link from "next/link"
import { useRouter } from "next/router"
import { FileUser, Images, Sigma } from "lucide-react"

const links = [
  { href: "/cvExtractor", label: "CV Extractor", icon: FileUser },
  { href: "/imageSearch", label: "Image Search", icon: Images }
]

export default function Navbar() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
            <Sigma className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">CV &amp; Image Engine</span>
        </Link>
        <ul className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-ink-50 text-ink-900" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
