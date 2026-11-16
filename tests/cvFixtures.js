import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { createCanvas } from "@napi-rs/canvas"
import { makeScene, mulberry32 } from "./helpers.js"

export function portraitPng(seed = 3, width = 220, height = 280) {
  const rand = mulberry32(seed)
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, "#6f8fb5")
  background.addColorStop(1, "#b9c8d9")
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#2f3b52"
  ctx.beginPath()
  ctx.ellipse(width / 2, height + 20, width * 0.48, height * 0.38, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#4a3426"
  ctx.beginPath()
  ctx.ellipse(width / 2, height * 0.38, width * 0.3, height * 0.26, 0, 0, Math.PI * 2)
  ctx.fill()
  const skin = ctx.createRadialGradient(width / 2, height * 0.42, 10, width / 2, height * 0.42, width * 0.3)
  skin.addColorStop(0, "#e3b48f")
  skin.addColorStop(1, "#c68e68")
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(width / 2, height * 0.43, width * 0.24, height * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#2a1c14"
  ctx.beginPath()
  ctx.arc(width * 0.42, height * 0.4, 6, 0, Math.PI * 2)
  ctx.arc(width * 0.58, height * 0.4, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "#8a4b3a"
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(width / 2, height * 0.52, 22, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(${Math.floor(rand() * 90)},${Math.floor(rand() * 90)},${Math.floor(rand() * 90)},0.06)`
    ctx.fillRect(rand() * width, rand() * height, 2, 2)
  }
  return canvas.toBuffer("image/png")
}

export function logoPng() {
  const canvas = createCanvas(64, 64)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = "#1f4fd8"
  ctx.fillRect(8, 8, 48, 48)
  return canvas.toBuffer("image/png")
}

export function bannerPng() {
  const canvas = createCanvas(600, 40)
  const ctx = canvas.getContext("2d")
  const g = ctx.createLinearGradient(0, 0, 600, 0)
  g.addColorStop(0, "#1f4fd8")
  g.addColorStop(1, "#0e1630")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 600, 40)
  return canvas.toBuffer("image/png")
}

export function scanPng() {
  return makeScene(9, 600, 800).toBuffer("image/png")
}

async function createDoc() {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  return { doc, page, regular, bold }
}

function writeEntries(ctx, x, startY, entries) {
  let y = startY
  for (const entry of entries) {
    const size = entry.size || 10
    y -= (entry.gap || 0) + size * 1.35
    ctx.page.drawText(entry.text, {
      x: x + (entry.indent || 0),
      y,
      size,
      font: entry.bold ? ctx.bold : ctx.regular,
      color: rgb(0.1, 0.1, 0.12)
    })
  }
  return y
}

export const PROJECT_ENTRIES = [
  { text: "PROJETS", size: 13, bold: true, gap: 16 },
  { text: "Hotel Management System", bold: true, size: 11, gap: 8 },
  { text: "Janvier 2024 - Mars 2024", size: 9 },
  { text: "• Application web de gestion des reservations et de la facturation d'un hotel.", indent: 8 },
  { text: "• Authentification JWT et tableau de bord statistique.", indent: 8 },
  { text: "Technologies : Spring Boot, MySQL, React, Docker", size: 9 },
  { text: "Application mobile de suivi sportif", bold: true, size: 11, gap: 12 },
  { text: "2023", size: 9 },
  { text: "• Application Flutter permettant de suivre les seances et de synchroniser les donnees avec Firebase.", indent: 8 },
  { text: "Technologies : Flutter, Firebase, Dart", size: 9 },
  { text: "Plateforme de gestion de bibliotheque", bold: true, size: 11, gap: 12 },
  { text: "Juin 2022 - Septembre 2022", size: 9 },
  { text: "• API REST complete pour gerer les livres, les emprunts et les utilisateurs d'une bibliotheque universitaire.", indent: 8 },
  { text: "Technologies : Java, Spring Boot, PostgreSQL", size: 9 }
]

export const EXPERIENCE_ENTRIES = [
  { text: "EXPERIENCE PROFESSIONNELLE", size: 13, bold: true, gap: 16 },
  { text: "Stage de fin d'etudes chez Atlas Digital Solutions", bold: true, size: 11, gap: 8 },
  { text: "Fevrier 2024 - Juillet 2024", size: 9 },
  { text: "• Developpement d'un module de reporting pour les equipes commerciales.", indent: 8 },
  { text: "Developpeur web junior chez Maroc Services", bold: true, size: 11, gap: 12 },
  { text: "2022 - 2023", size: 9 },
  { text: "• Maintenance des sites clients et support technique.", indent: 8 }
]

export const EDUCATION_ENTRIES = [
  { text: "FORMATION", size: 13, bold: true, gap: 16 },
  { text: "Cycle ingenieur en informatique - Universite Internationale Centrale de Casablanca", size: 10, gap: 6 },
  { text: "2019 - 2024", size: 9 },
  { text: "COMPETENCES", size: 13, bold: true, gap: 16 },
  { text: "JavaScript, Java, Dart, SQL, Spring Boot, React, Flutter", size: 10, gap: 6 }
]

export const PROFILE_ENTRIES = [
  { text: "PROFIL", size: 13, bold: true, gap: 16 },
  { text: "Ingenieur logiciel passionne par le developpement web et mobile, je conçois des applications", gap: 6 },
  { text: "fiables et bien structurees. Je recherche un poste ou je pourrai mettre en pratique mes", gap: 0 },
  { text: "competences en architecture logicielle et en travail d'equipe.", gap: 0 }
]

export async function buildCvPdf(options = {}) {
  const {
    first = "Sara",
    last = "Benali",
    headerLine,
    jobTitle = "Developpeuse Full Stack",
    email = "sara.benali@example-mail.com",
    phone = "+212 6 61 23 45 67",
    city = "Casablanca, Maroc",
    photo = false,
    logo = false,
    profile = true,
    projects = true,
    experience = true,
    extraProjectsHeading
  } = options
  const ctx = await createDoc()
  const header = headerLine || `${first} ${last}`
  let y = 842 - 40
  y = writeEntries(ctx, 50, y, [
    { text: header, size: 26, bold: true },
    { text: jobTitle, size: 12, gap: 4 },
    { text: `${email}   |   ${phone}   |   ${city}`, size: 9.5, gap: 6 }
  ])
  let entries = []
  if (profile) {
    entries = entries.concat(PROFILE_ENTRIES)
  }
  if (projects) {
    const copy = PROJECT_ENTRIES.map((e) => ({ ...e }))
    if (extraProjectsHeading) {
      copy[0].text = extraProjectsHeading
    }
    entries = entries.concat(copy)
  }
  if (experience) {
    entries = entries.concat(EXPERIENCE_ENTRIES)
  }
  entries = entries.concat(EDUCATION_ENTRIES)
  writeEntries(ctx, 50, y - 10, entries)
  if (photo) {
    const image = await ctx.doc.embedPng(portraitPng())
    ctx.page.drawImage(image, { x: 595 - 50 - 90, y: 842 - 40 - 112, width: 90, height: 112 })
  }
  if (logo) {
    const image = await ctx.doc.embedPng(logoPng())
    ctx.page.drawImage(image, { x: 50, y: 40, width: 30, height: 30 })
    const banner = await ctx.doc.embedPng(bannerPng())
    ctx.page.drawImage(banner, { x: 0, y: 0, width: 595, height: 12 })
  }
  return Buffer.from(await ctx.doc.save())
}

export async function buildTwoColumnCvPdf() {
  const ctx = await createDoc()
  ctx.page.drawRectangle({ x: 0, y: 0, width: 190, height: 842, color: rgb(0.93, 0.95, 0.98) })
  const photoImage = await ctx.doc.embedPng(portraitPng(5))
  ctx.page.drawImage(photoImage, { x: 45, y: 842 - 40 - 110, width: 100, height: 110 })
  writeEntries(ctx, 20, 842 - 170, [
    { text: "CONTACT", size: 12, bold: true },
    { text: "Tel : 0661 23 45 67", size: 9, gap: 6 },
    { text: "youssef.alaoui@gmail.com", size: 9, gap: 2 },
    { text: "Berchid, Maroc", size: 9, gap: 2 },
    { text: "COMPETENCES", size: 12, bold: true, gap: 20 },
    { text: "React, Next.js, Node.js", size: 9, gap: 4 },
    { text: "Spring Boot, MySQL", size: 9, gap: 2 },
    { text: "LANGUES", size: 12, bold: true, gap: 20 },
    { text: "Francais, Arabe, Anglais", size: 9, gap: 4 }
  ])
  writeEntries(ctx, 220, 842 - 40, [
    { text: "ALAOUI Youssef", size: 24, bold: true },
    { text: "Etudiant ingenieur", size: 12, gap: 4 },
    { text: "A PROPOS", size: 12, bold: true, gap: 20 },
    { text: "Etudiant en derniere annee de cycle ingenieur,", gap: 6 },
    { text: "je developpe des applications web et mobiles et je", gap: 0 },
    { text: "m'interesse a la qualite logicielle ainsi qu'aux", gap: 0 },
    { text: "architectures modernes de type API.", gap: 0 },
    { text: "REALISATIONS", size: 12, bold: true, gap: 20 },
    { text: "Plateforme d'apprentissage du langage C", bold: true, size: 11, gap: 8 },
    { text: "2024", size: 9 },
    { text: "• Cours interactifs avec exercices corriges", indent: 6 },
    { text: "automatiquement.", indent: 12 },
    { text: "Technologies : Next.js, Tailwind CSS, MySQL", size: 9 },
    { text: "Gestionnaire de paniers alimentaires", bold: true, size: 11, gap: 12 },
    { text: "2024", size: 9 },
    { text: "• Suivi des beneficiaires et des distributions.", indent: 6 },
    { text: "Technologies : Next.js, MySQL, Vercel", size: 9 }
  ])
  return Buffer.from(await ctx.doc.save())
}

export async function buildScannedPdf() {
  const ctx = await createDoc()
  const image = await ctx.doc.embedPng(scanPng())
  ctx.page.drawImage(image, { x: 0, y: 0, width: 595, height: 842 })
  return Buffer.from(await ctx.doc.save())
}
