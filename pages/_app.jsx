import Head from "next/head"
import "../styles/globals.css"
import Navbar from "../components/navbar.jsx"

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>CV and Image Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Extraction de CV PDF et recherche d'images similaires, sans IA, traitée localement." />
      </Head>
      <div className="min-h-screen bg-ink-50/50 font-sans text-ink-900 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  )
}
