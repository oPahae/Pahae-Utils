import test from "node:test"
import assert from "node:assert/strict"
import pdfjs from "pdfjs-dist/legacy/build/pdf.js"
import { analyzePdf, PdfReadError, openPdf } from "../lib/pdfExtractor.js"
import { parseCv, extractPhone, extractEmail, findTechnologies } from "../lib/cvParser.js"
import { buildCvPdf, buildTwoColumnCvPdf, buildScannedPdf } from "./cvFixtures.js"

async function analyze(buffer, options) {
  const analysis = await analyzePdf(pdfjs, new Uint8Array(buffer), options)
  return { analysis, cv: parseCv(analysis) }
}

function show(label, cv) {
  console.log(
    `  ${label}: ${cv.firstName.value}|${cv.lastName.value} (${cv.firstName.confidence}) email=${cv.email.value} tel=${cv.phone.value} projets=${cv.projects.length} bio=${cv.bio.value.slice(0, 30)}`
  )
}

test("CV complet : nom, email, téléphone, biographie et projets", async () => {
  const { analysis, cv } = await analyze(await buildCvPdf({ photo: true }))
  show("complet", cv)
  assert.equal(cv.firstName.value, "Sara")
  assert.equal(cv.lastName.value, "Benali")
  assert.ok(cv.firstName.confidence >= 0.6)
  assert.equal(cv.email.value, "sara.benali@example-mail.com")
  assert.equal(cv.phone.normalized, "+212661234567")
  assert.match(cv.bio.value, /^Ingenieur logiciel passionne/)
  assert.match(cv.bio.value, /travail d'equipe\.$/)
  assert.equal(cv.bio.source.startsWith("section"), true)
  assert.equal(analysis.scanned, false)
  assert.equal(cv.noText, false)
  assert.equal(cv.warnings.length, 0)
  assert.equal(cv.projects.length, 3, JSON.stringify(cv.projects, null, 1))
  const [hotel, mobile, library] = cv.projects
  assert.equal(hotel.name, "Hotel Management System")
  assert.equal(hotel.period, "Janvier 2024 - Mars 2024")
  assert.deepEqual(hotel.technologies, ["Spring Boot", "MySQL", "React", "Docker"])
  assert.match(hotel.description, /reservations et de la facturation/)
  assert.equal(mobile.name, "Application mobile de suivi sportif")
  assert.equal(mobile.period, "2023")
  assert.deepEqual(mobile.technologies, ["Flutter", "Firebase", "Dart"])
  assert.equal(library.name, "Plateforme de gestion de bibliotheque")
  assert.deepEqual(library.technologies, ["Java", "Spring Boot", "PostgreSQL"])
  assert.equal(library.period, "Juin 2022 - Septembre 2022")
  assert.ok(!/Juin 2022/.test(library.description), library.description)
})

test("les expériences professionnelles ne sont pas prises pour des projets", async () => {
  const { cv } = await analyze(await buildCvPdf())
  const names = cv.projects.map((p) => p.name).join(" | ")
  assert.ok(!/Stage|Atlas|Maroc Services|junior/i.test(names), names)
  assert.equal(cv.projects.length, 3)
})

test("CV avec photo incorporée : la photo est détectée parmi les images, les logos sont écartés", async () => {
  const { analysis } = await analyze(await buildCvPdf({ photo: true, logo: true }))
  assert.ok(analysis.images.length >= 2, `images: ${analysis.images.length}`)
  const best = analysis.images[0]
  console.log(
    "  candidats :",
    analysis.images.map((i) => `${i.nativeWidth}x${i.nativeHeight} score=${i.score.toFixed(2)}`).join(" ; ")
  )
  assert.equal(best.nativeWidth, 220)
  assert.equal(best.nativeHeight, 280)
  assert.ok(best.score >= 0.7, `score ${best.score}`)
  assert.equal(best.page, 1)
  assert.ok(best.bbox.top < 200)
  assert.ok(Math.abs(best.bbox.w - 90) < 1 && Math.abs(best.bbox.h - 112) < 1)
  for (const other of analysis.images.slice(1)) {
    assert.ok(other.score < 0.45, `l'image ${other.nativeWidth}x${other.nativeHeight} est trop bien notée : ${other.score}`)
  }
  assert.equal(best.rgba.length, 220 * 280 * 4)
})

test("CV sans photo : aucune candidate n'est présentée comme photo", async () => {
  const { analysis, cv } = await analyze(await buildCvPdf({ photo: false }))
  assert.equal(analysis.images.length, 0)
  assert.equal(cv.noText, false)
})

test("CV sans photo mais avec logo et bannière : aucune image n'atteint le seuil de photo probable", async () => {
  const { analysis } = await analyze(await buildCvPdf({ photo: false, logo: true }))
  for (const image of analysis.images) {
    assert.ok(image.score < 0.45, `score ${image.score}`)
  }
})

test("noms composés, particules et ordre NOM Prénom", async () => {
  const cases = [
    [{ first: "Mohamed", last: "El Amrani" }, "Mohamed", "El Amrani"],
    [{ first: "Fatima-Zahra", last: "BENNANI" }, "Fatima-Zahra", "BENNANI"],
    [{ headerLine: "ALAOUI Youssef" }, "Youssef", "ALAOUI"],
    [{ headerLine: "Jean-Pierre DE LA FONTAINE" }, "Jean-Pierre", "DE LA FONTAINE"],
    [{ headerLine: "Mohamed Amine Tazi" }, "Mohamed Amine", "Tazi"]
  ]
  for (const [options, first, last] of cases) {
    const { cv } = await analyze(await buildCvPdf(options))
    show("nom", cv)
    assert.equal(cv.firstName.value, first)
    assert.equal(cv.lastName.value, last)
  }
})

test("la première ligne n'est pas aveuglément prise pour le nom", async () => {
  const { cv } = await analyze(await buildCvPdf({ headerLine: "Curriculum Vitae" }))
  assert.notEqual(cv.firstName.value, "Curriculum")
  assert.equal(cv.firstName.value === "" || cv.firstName.confidence < 0.55 || !/Curriculum/.test(cv.fullName), true)
})

test("numéros marocains et rejet des dates", () => {
  const sample = (text) => extractPhone([{ text, page: 1 }])
  assert.equal(sample("Tel : 06 61 23 45 67").normalized, "+212661234567")
  assert.equal(sample("+212 661-234567").normalized, "+212661234567")
  assert.equal(sample("00212 6 61 23 45 67").normalized, "+212661234567")
  assert.equal(sample("+212 (0)6 61 23 45 67").normalized, "+212661234567")
  assert.equal(sample("0522 12 34 56").normalized, "+212522123456")
  assert.equal(sample("07.12.34.56.78").normalized, "+212712345678")
  assert.equal(sample("+33 6 12 34 56 78").normalized, "+33612345678")
  assert.equal(sample("2019 - 2024").value, "")
  assert.equal(sample("Du 12/03/2021 au 15/09/2023").value, "")
  assert.equal(sample("Casablanca 20000").value, "")
  assert.equal(sample("CIN : AB123456").value, "")
  assert.equal(sample("Obtenu en 2022-2023, mention bien").value, "")
})

test("email : formats courants", () => {
  const sample = (text) => extractEmail([{ text, page: 1 }]).value
  assert.equal(sample("Mail : prenom.nom+cv@sous.domaine.co.ma"), "prenom.nom+cv@sous.domaine.co.ma")
  assert.equal(sample("contact: a_b-c@univ-casa.ma."), "a_b-c@univ-casa.ma")
  assert.equal(sample("aucun email ici"), "")
  assert.equal(sample("john.doe @ gmail.com"), "john.doe@gmail.com")
})

test("détection de technologies", () => {
  assert.deepEqual(findTechnologies("Application en Next.js avec Tailwind CSS et MySQL, API REST, Node.js"), ["Next.js", "Tailwind CSS", "MySQL", "API REST", "Node.js"])
  assert.deepEqual(findTechnologies("Java et JavaScript"), ["Java", "JavaScript"])
})

test("CV à deux colonnes avec barre latérale, projets sous « Réalisations » et nom au format NOM Prénom", async () => {
  const { analysis, cv } = await analyze(await buildTwoColumnCvPdf())
  show("deux colonnes", cv)
  assert.equal(analysis.pages[0].columns, 2)
  assert.equal(cv.firstName.value, "Youssef")
  assert.equal(cv.lastName.value, "ALAOUI")
  assert.equal(cv.email.value, "youssef.alaoui@gmail.com")
  assert.equal(cv.phone.normalized, "+212661234567")
  assert.match(cv.bio.value, /^Etudiant en derniere annee/)
  assert.ok(!/COMPETENCES|React/.test(cv.bio.value))
  assert.equal(cv.projects.length, 2, JSON.stringify(cv.projects, null, 1))
  assert.equal(cv.projects[0].name, "Plateforme d'apprentissage du langage C")
  assert.deepEqual(cv.projects[0].technologies, ["Next.js", "Tailwind CSS", "MySQL"])
  assert.equal(cv.projects[1].name, "Gestionnaire de paniers alimentaires")
  assert.equal(analysis.images[0].nativeWidth, 220)
})

test("CV sans section profil : la biographie reste vide plutôt qu'inventée", async () => {
  const { cv } = await analyze(await buildCvPdf({ profile: false }))
  assert.equal(cv.bio.value, "")
  assert.equal(cv.bio.confidence, 0)
})

test("section de projets intitulée « Projects » et variantes", async () => {
  for (const heading of ["PROJECTS", "PERSONAL PROJECTS", "REALISATIONS", "PROJETS ACADEMIQUES"]) {
    const { cv } = await analyze(await buildCvPdf({ extraProjectsHeading: heading }))
    assert.equal(cv.projects.length, 3, `${heading}: ${cv.projects.length}`)
  }
})

test("PDF scanné (images uniquement) : OCR indisponible signalé, aucun champ inventé", async () => {
  const { analysis, cv } = await analyze(await buildScannedPdf())
  assert.equal(analysis.characters, 0)
  assert.equal(analysis.scanned, true)
  assert.equal(cv.noText, true)
  assert.equal(cv.firstName.value, "")
  assert.equal(cv.email.value, "")
  assert.equal(cv.projects.length, 0)
  assert.match(cv.warnings[0], /OCR n'est pas disponible/)
  assert.equal(analysis.images.length, 1)
  assert.equal(analysis.images[0].score, 0)
})

test("fichier corrompu : erreur explicite", async () => {
  await assert.rejects(
    () => openPdf(pdfjs, new TextEncoder().encode("%PDF-1.4\nceci n'est pas un vrai pdf\n%%EOF")),
    (error) => error instanceof PdfReadError && error.code === "corrupt"
  )
})
