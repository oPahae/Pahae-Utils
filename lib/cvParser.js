const FIRST_NAMES = new Set(
  (
    "mohamed mohammed muhammad ahmed ahmad ali omar oumar youssef youssouf yassine yacine hamza hassan hassane hussein houssein " +
    "ibrahim brahim ismail ismael karim kamal khalid khaled said saad saïd samir sami soufiane souhail anas amine ayoub adam " +
    "abdelhak abdelkader abdelaziz abdellah abderrahmane abdelilah abdelmajid abdessamad bilal badr brahim chakib driss " +
    "fouad hicham hakim hatim imad idriss jamal jalal mehdi mustapha mourad mounir mouad marouane marwane nabil nadir nizar " +
    "othmane oussama rachid redouane reda rida salah salim soufian taha tarik tariq walid yahya younes zakaria zakariae " +
    "fatima fatimazahra khadija khadidja aicha aisha amina asmae asma btissam chaimae dounia fatiha ghita ghizlane hafsa " +
    "hajar halima hanane houda ikram imane jamila kawtar latifa laila leila loubna maryam meryem mariam mouna nadia najat " +
    "naima nawal noura oumaima rajae rim rania safae salma samira sanae sara sarah siham soukaina soumaya zineb zahra " +
    "jean pierre paul jacques michel philippe alain louis marc nicolas thomas julien antoine alexandre maxime hugo lucas " +
    "marie anne sophie claire camille emma lea chloe julie laura sandrine isabelle nathalie celine charlotte manon " +
    "john james robert michael william david richard joseph charles daniel matthew mark steven andrew kevin brian " +
    "mary patricia jennifer linda elizabeth barbara susan jessica karen emily alice olivia sophia"
  ).split(" ")
)

const NAME_PARTICLES = new Set(["de", "del", "della", "des", "du", "el", "al", "ben", "bin", "ibn", "ou", "ait", "aït", "abd", "abdel", "la", "le", "van", "von", "da", "dos", "di", "saint", "st", "ould", "oulad", "bou", "boul"])

const NOT_NAME_WORDS = new Set(
  (
    "curriculum vitae cv resume résumé profile profil developer developpeur développeur developpeuse engineer ingenieur ingénieur " +
    "student etudiant étudiant etudiante manager designer analyst analyste intern stagiaire consultant full stack fullstack web mobile " +
    "software data scientist architect technician technicien teacher professeur director directeur junior senior lead freelance expert " +
    "chef project projet projets contact email mail phone tel tél telephone téléphone address adresse about summary education " +
    "formation experience expérience skills competences compétences langues languages certifications interests university " +
    "universite université school ecole école institut faculty faculté diplome diplôme master licence bachelor mba phd " +
    "informatique computer science genie génie logiciel digital marketing finance comptable accountant assistant assistante " +
    "recherche emploi poste candidat candidate disponible available maroc morocco casablanca rabat france paris city ville " +
    "linkedin github portfolio website site personal personnel professional professionnel objectif objective"
  ).split(" ")
)

const SECTION_FILLER_WORDS = new Set(
  (
    "personal academic professional side selected key university school notable featured major freelance and et projects project " +
    "projets projet realisations realisation experiences experience personnels personnelles academiques universitaires " +
    "professionnels professionnelles scolaires techniques realises de des mes my our recent other autres principaux principales " +
    "selectionnes"
  ).split(" ")
)

const SUMMARY_HEADINGS = new Set([
  "about me",
  "about",
  "about myself",
  "profile",
  "professional profile",
  "professional summary",
  "summary",
  "career objective",
  "career summary",
  "objective",
  "personal profile",
  "personal statement",
  "executive summary",
  "professional bio",
  "bio",
  "a propos",
  "a propos de moi",
  "profil",
  "profil professionnel",
  "presentation",
  "resume",
  "resume professionnel",
  "objectif",
  "objectif professionnel",
  "biographie",
  "qui suis je"
])

const OTHER_HEADINGS = new Set(
  (
    "experience|experiences|work experience|professional experience|experience professionnelle|experiences professionnelles|" +
    "parcours professionnel|parcours|employment history|work history|education|formation|formations|education and training|" +
    "formation academique|parcours academique|diplomes|skills|competences|technical skills|competences techniques|hard skills|" +
    "soft skills|langues|languages|certifications|certificates|certificats|interests|hobbies|centres d interet|centres d interets|" +
    "loisirs|interets|contact|contacts|contact me|coordonnees|informations personnelles|personal information|personal details|" +
    "references|volunteer|volunteering|benevolat|vie associative|awards|honors|publications|courses|stages|internships|" +
    "internship experience|activities|activites|extracurricular activities|links|liens|social|reseaux sociaux|technologies|" +
    "tools|outils|langages|programming languages|languages and tools|stack technique|technical stack|competences cles|" +
    "key skills|core skills|qualities|qualites|atouts|permis|driving license|distinctions|achievements"
  ).split("|")
)

const TECHNOLOGIES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "PHP",
  "Kotlin",
  "Swift",
  "Dart",
  "Ruby",
  "Rust",
  "Golang",
  "Scala",
  "SQL",
  "HTML",
  "HTML5",
  "CSS",
  "CSS3",
  "React",
  "React.js",
  "ReactJS",
  "React Native",
  "Next.js",
  "NextJS",
  "Vue",
  "Vue.js",
  "Nuxt",
  "Angular",
  "Svelte",
  "jQuery",
  "Node.js",
  "NodeJS",
  "Express",
  "Express.js",
  "NestJS",
  "Spring Boot",
  "Spring",
  "Hibernate",
  "Laravel",
  "Symfony",
  "Django",
  "Flask",
  "FastAPI",
  "ASP.NET",
  ".NET",
  "Flutter",
  "Android",
  "Android Studio",
  "iOS",
  "Tailwind",
  "TailwindCSS",
  "Tailwind CSS",
  "Bootstrap",
  "Sass",
  "Material UI",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "SQLite",
  "Oracle",
  "Redis",
  "Firebase",
  "Supabase",
  "GraphQL",
  "REST",
  "REST API",
  "API REST",
  "JWT",
  "Docker",
  "Kubernetes",
  "Git",
  "GitHub",
  "GitLab",
  "Jenkins",
  "AWS",
  "Azure",
  "Vercel",
  "Linux",
  "Figma",
  "Jira",
  "Unity",
  "OpenCV",
  "TensorFlow",
  "PyTorch",
  "Pandas",
  "NumPy",
  "Selenium",
  "Arduino",
  "Raspberry Pi",
  "Power BI",
  "Excel",
  "UML",
  "Maven",
  "JUnit",
  "Prisma",
  "Sequelize",
  "Socket.io",
  "WebSocket",
  "Electron",
  "Three.js",
  "Pages Router"
]

const TECH_LOOKUP = new Map(TECHNOLOGIES.map((name) => [name.toLowerCase(), name]))

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const TECH_REGEX = new RegExp(
  "(?<![A-Za-z0-9+#.])(" +
    [...TECHNOLOGIES]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|") +
    ")(?![A-Za-z0-9+#])",
  "gi"
)

const MONTHS =
  "(?:jan(?:uary|vier)?|feb(?:ruary)?|f[eé]v(?:rier)?|mar(?:ch|s)?|apr(?:il)?|avr(?:il)?|may|mai|jun(?:e)?|juin|jul(?:y)?|juil(?:let)?|aug(?:ust)?|ao[uû]t?|sep(?:t(?:ember|embre)?)?|oct(?:ober|obre)?|nov(?:ember|embre)?|dec(?:ember)?|d[eé]c(?:embre)?)\\.?"
const DATE_POINT = `(?:${MONTHS}\\s+)?(?:19|20)\\d{2}`
const DATE_END = `(?:${DATE_POINT}|present|pr[eé]sent|aujourd'hui|now|en cours|ongoing|current|actuellement)`
const PERIOD_REGEX = new RegExp(`\\(?\\b(${DATE_POINT}\\s*(?:-|–|—|to|[aà]|/)\\s*${DATE_END})\\b\\)?`, "i")
const SINGLE_DATE_REGEX = new RegExp(`[\\(\\[]\\s*(${DATE_POINT})\\s*[\\)\\]]|(?:^|[\\s,\\-–—|])(${MONTHS}\\s+(?:19|20)\\d{2})\\s*$|(?:^|\\s[-–—|]\\s)((?:19|20)\\d{2})\\s*$`, "i")

const BULLET_REGEX = /^\s*[•●▪■◦▫∙·►➢\u2713»*\-–—]\s+/

export function normalizeText(value) {
  return value
    .replace(/[   ]/g, " ")
    .replace(/[​-‍﻿]/g, "")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/^[-■-◿•‣⁃]\s*/, "• ")
    .replace(/\s+/g, " ")
    .trim()
}

export function stripAccents(value) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function headingKey(text) {
  return stripAccents(text.toLowerCase())
    .replace(/&/g, " and ")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9؀-ۿ ]+/g, " ")
    .replace(/^\d+\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function classifyHeading(text) {
  if (!text || text.length > 60) {
    return null
  }
  const key = headingKey(text)
  if (!key) {
    return null
  }
  const words = key.split(" ")
  if (SUMMARY_HEADINGS.has(key)) {
    return "summary"
  }
  const projectWords = ["project", "projects", "projet", "projets", "realisation", "realisations"]
  if (words.length <= 6 && words.some((w) => projectWords.includes(w)) && words.every((w) => SECTION_FILLER_WORDS.has(w))) {
    return "projects"
  }
  if (OTHER_HEADINGS.has(key)) {
    return "other"
  }
  return null
}

function isUnknownCapsHeading(text) {
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, "")
  if (letters.length < 4 || /\d|@/.test(text)) {
    return false
  }
  const words = text.split(" ")
  return words.length <= 4 && text === text.toUpperCase()
}

function isBullet(text) {
  return BULLET_REGEX.test(text)
}

function stripBullet(text) {
  return text.replace(BULLET_REGEX, "").trim()
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length
}

function field(value, confidence, source) {
  return { value, confidence: value ? Math.round(confidence * 100) / 100 : 0, source: value ? source : "non trouvé" }
}

function prepareLines(rawLines) {
  const lines = []
  for (const line of rawLines) {
    const text = normalizeText(line.text)
    if (text) {
      lines.push({ ...line, text })
    }
  }
  const gaps = []
  for (let i = 0; i < lines.length; i++) {
    const prev = lines[i - 1]
    const line = lines[i]
    if (prev && prev.page === line.page && prev.column === line.column) {
      line.gapBefore = line.y - prev.y
      gaps.push(line.gapBefore)
    } else {
      line.gapBefore = null
    }
  }
  gaps.sort((a, b) => a - b)
  const leading = gaps.length > 0 ? gaps[Math.floor(gaps.length * 0.4)] : 12
  for (const line of lines) {
    line.newBlock = line.gapBefore === null || line.gapBefore > Math.max(leading, 6) * 1.55
  }
  return lines
}

function buildSections(lines) {
  const sections = [{ type: "header", title: "", lines: [] }]
  for (const line of lines) {
    const type = classifyHeading(line.text)
    if (type) {
      sections.push({ type, title: line.text, lines: [] })
    } else if (isUnknownCapsHeading(line.text) && sections.length > 1) {
      sections.push({ type: "unknown", title: line.text, lines: [] })
    } else {
      sections[sections.length - 1].lines.push(line)
    }
  }
  return sections
}

const EMAIL_REGEX = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}/g

export function extractEmail(lines) {
  const found = []
  const scan = (text, bonus) => {
    for (const match of text.matchAll(EMAIL_REGEX)) {
      const value = match[0].replace(/^[._%+\-]+/, "").replace(/[.\-_]+$/, "")
      if (/^(example|exemple|email|votre|your|name)@/i.test(value) || /@(example|exemple)\./i.test(value)) {
        continue
      }
      if (!found.some((f) => f.value.toLowerCase() === value.toLowerCase())) {
        found.push({ value, bonus })
      }
    }
  }
  for (const line of lines) {
    scan(line.text, 0)
  }
  if (found.length === 0) {
    for (const line of lines) {
      const compact = line.text.replace(/\s*@\s*/g, "@").replace(/\s*\.\s*(com|ma|fr|net|org|edu|io|dev)\b/gi, ".$1")
      scan(compact, -0.1)
    }
  }
  if (found.length === 0) {
    return { ...field("", 0, ""), alternatives: [] }
  }
  const best = found[0]
  return { ...field(best.value, 0.95 + best.bonus, "expression régulière"), alternatives: found.slice(1).map((f) => f.value) }
}

const PHONE_CANDIDATE = /[+(]?\d[\d\s().\-\/]{6,24}\d/g
const PHONE_LABEL = /(t[eé]l(?:[eé]phone)?|phone|mobile|gsm|whats?app|portable|cell|contact)\s*[:.\-]?\s*$/i
const ID_LABEL = /(cin|cne|passport|passeport|siret|siren|n°|no\.|id|rib|iban|code postal|zip|postal)\s*[:.\-]?\s*$/i

function evaluatePhone(raw, before) {
  let text = raw.replace(/\(0\)/g, "").trim()
  text = text.replace(/^[()\s.\-\/]+|[()\s.\-\/]+$/g, "")
  const digits = text.replace(/\D/g, "")
  if (digits.length < 8 || digits.length > 15) {
    return null
  }
  if (/^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}$/.test(text) || /^(19|20)\d{2}[\/.\-]\d{1,2}[\/.\-]\d{1,2}$/.test(text)) {
    return null
  }
  if (/^(?:(?:19|20)\d{2}\D+){1,3}(?:19|20)\d{2}$/.test(text.trim())) {
    return null
  }
  if (ID_LABEL.test(before)) {
    return null
  }
  const labeled = PHONE_LABEL.test(before)
  const hasPlus = text.startsWith("+")
  let normalized = ""
  let confidence = 0
  let source = ""
  let national = digits
  if (digits.startsWith("00212")) {
    national = "0" + digits.slice(5)
    if (/^0[5-7]\d{8}$/.test(national)) {
      normalized = "+212" + national.slice(1)
      confidence = 0.92
      source = "format marocain international"
    }
  } else if (digits.startsWith("212") && (hasPlus || digits.length === 12)) {
    national = "0" + digits.slice(3)
    if (/^0[5-7]\d{8}$/.test(national)) {
      normalized = "+212" + national.slice(1)
      confidence = 0.92
      source = "format marocain international"
    }
  } else if (/^0[5-7]\d{8}$/.test(digits)) {
    normalized = "+212" + digits.slice(1)
    confidence = 0.88
    source = "format marocain local"
  }
  if (!normalized) {
    if (hasPlus && digits.length >= 8 && digits.length <= 15) {
      normalized = "+" + digits
      confidence = 0.82
      source = "format international"
    } else if (digits.startsWith("00") && digits.length >= 10) {
      normalized = "+" + digits.slice(2)
      confidence = 0.78
      source = "format international"
    } else if (/^0[1-9]\d{8}$/.test(digits)) {
      normalized = "+33" + digits.slice(1)
      confidence = 0.6
      source = "format national à 10 chiffres"
    } else if (labeled && digits.length >= 8) {
      normalized = digits
      confidence = 0.6
      source = "numéro précédé d'un libellé de téléphone"
    } else {
      return null
    }
  }
  if (labeled) {
    confidence = Math.min(0.97, confidence + 0.05)
  }
  return { value: text.replace(/\s+/g, " "), normalized, confidence, source }
}

export function extractPhone(lines) {
  const found = []
  lines.forEach((line, lineIndex) => {
    for (const match of line.text.matchAll(PHONE_CANDIDATE)) {
      const before = line.text.slice(Math.max(0, match.index - 24), match.index)
      const evaluated = evaluatePhone(match[0], before)
      if (evaluated) {
        found.push({ ...evaluated, lineIndex })
      }
    }
  })
  if (found.length === 0) {
    return { ...field("", 0, ""), normalized: "", alternatives: [] }
  }
  found.sort((a, b) => b.confidence - a.confidence || a.lineIndex - b.lineIndex)
  const best = found[0]
  const unique = []
  for (const f of found.slice(1)) {
    if (f.normalized !== best.normalized && !unique.some((u) => u.normalized === f.normalized)) {
      unique.push(f)
    }
  }
  return { ...field(best.value, best.confidence, best.source), normalized: best.normalized, alternatives: unique.map((u) => u.value) }
}

const NAME_TOKEN = /^[A-Za-zÀ-ÖØ-öø-ÿ؀-ۿ][A-Za-zÀ-ÖØ-öø-ÿ؀-ۿ'’\-.]*$/

function isUpperToken(token) {
  const letters = token.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "")
  return letters.length > 1 && letters === letters.toUpperCase()
}

function isTitleToken(token) {
  return /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’\-.]+(?:-[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’]+)*$/.test(token)
}

function isParticle(token) {
  return NAME_PARTICLES.has(stripAccents(token.toLowerCase()))
}

function isArabicToken(token) {
  return /[؀-ۿ]/.test(token)
}

function validNameTokens(text) {
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length < 2 || tokens.length > 5) {
    return null
  }
  for (const token of tokens) {
    if (!NAME_TOKEN.test(token) || token.replace(/[^A-Za-zÀ-ÿ؀-ۿ]/g, "").length < 2) {
      return null
    }
    if (NOT_NAME_WORDS.has(stripAccents(token.toLowerCase()).replace(/[.]/g, ""))) {
      return null
    }
  }
  const allArabic = tokens.every(isArabicToken)
  const casingOk = allArabic || tokens.every((t) => isUpperToken(t) || isTitleToken(t) || isParticle(t))
  if (!casingOk) {
    return null
  }
  return tokens
}

function splitNameTokens(tokens) {
  const upper = tokens.filter(isUpperToken)
  const title = tokens.filter((t) => isTitleToken(t) && !isUpperToken(t))
  if (upper.length > 0 && title.length > 0 && upper.length + title.length + tokens.filter(isParticle).length >= tokens.length) {
    const lastIdx = []
    tokens.forEach((t, i) => {
      if (isUpperToken(t)) {
        lastIdx.push(i)
      }
    })
    const last = []
    const first = []
    tokens.forEach((t, i) => {
      const nextIsLast = lastIdx.includes(i + 1)
      const prevIsLast = lastIdx.includes(i - 1)
      if (lastIdx.includes(i) || (isParticle(t) && (nextIsLast || prevIsLast))) {
        last.push(t)
      } else {
        first.push(t)
      }
    })
    if (first.length > 0 && last.length > 0) {
      return { first: first.join(" "), last: last.join(" "), confidence: 0.85, source: "casse (NOM en majuscules)" }
    }
  }
  const lowerTokens = tokens.map((t) => stripAccents(t.toLowerCase()))
  const firstKnown = FIRST_NAMES.has(lowerTokens[0].replace(/[^a-z]/g, ""))
  const lastKnown = FIRST_NAMES.has(lowerTokens[tokens.length - 1].replace(/[^a-z]/g, ""))
  if (tokens.length === 2 && lastKnown && !firstKnown) {
    return { first: tokens[1], last: tokens[0], confidence: 0.7, source: "ordre NOM Prénom (prénom reconnu)" }
  }
  const rest = [...tokens]
  const last = [rest.pop()]
  while (rest.length > 1 && isParticle(rest[rest.length - 1])) {
    last.unshift(rest.pop())
  }
  const allUpper = tokens.every(isUpperToken)
  let confidence = tokens.length === 2 ? 0.78 : 0.62
  let source = "dernier mot considéré comme nom de famille"
  if (firstKnown) {
    confidence += 0.07
    source = "prénom reconnu en début de ligne"
  }
  if (allUpper && !firstKnown) {
    confidence = 0.5
    source = "tout en majuscules : ordre prénom / nom incertain"
  }
  return { first: rest.join(" "), last: last.join(" "), confidence: Math.min(confidence, 0.9), source }
}

function cleanNameValue(value) {
  return value.replace(/[|•·].*$/, "").replace(/\s+/g, " ").trim()
}

function nameFromLabels(lines) {
  let first = ""
  let last = ""
  let full = ""
  for (const line of lines) {
    if (line.page !== 1) {
      continue
    }
    let m = /^(?:nom\s*(?:et|&)\s*pr[eé]noms?|nom\s*complet|full\s*name|name)\s*[:：]\s*(.+)$/i.exec(line.text)
    if (m && !full) {
      full = cleanNameValue(m[1])
      continue
    }
    m = /^(?:pr[eé]noms?|first\s*name|given\s*name)\s*[:：]\s*(.+)$/i.exec(line.text)
    if (m && !first) {
      first = cleanNameValue(m[1])
      continue
    }
    m = /^(?:nom(?:\s*de\s*famille)?|last\s*name|surname|family\s*name)\s*[:：]\s*(.+)$/i.exec(line.text)
    if (m && !last) {
      last = cleanNameValue(m[1])
    }
  }
  const sane = (v) => v && !/[\d@]/.test(v) && wordCount(v) <= 5
  if (sane(first) && sane(last)) {
    return { first, last, confidence: 0.93, source: "libellés Prénom / Nom" }
  }
  if (sane(full)) {
    const tokens = full.split(/\s+/)
    if (tokens.length >= 2) {
      const split = splitNameTokens(tokens)
      return { first: split.first, last: split.last, confidence: Math.max(split.confidence, 0.85), source: "libellé Nom complet" }
    }
  }
  if (sane(first) || sane(last)) {
    return { first: sane(first) ? first : "", last: sane(last) ? last : "", confidence: 0.8, source: "libellé partiel (Prénom ou Nom)" }
  }
  return null
}

function median(values) {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export function extractName(lines, email, pages) {
  const labeled = nameFromLabels(lines)
  if (labeled) {
    return labeled
  }
  const pageOne = lines.filter((l) => l.page === 1)
  if (pageOne.length === 0) {
    return null
  }
  const pageHeight = pages && pages[0] ? pages[0].height : Math.max(...pageOne.map((l) => l.y)) + 40
  const medianSize = median(pageOne.map((l) => l.fsMax || l.fs))
  const maxSize = Math.max(...pageOne.map((l) => l.fsMax || l.fs))
  const emailLocal = email ? stripAccents(email.toLowerCase().split("@")[0]).replace(/[^a-z]/g, " ") : ""
  const candidates = []
  pageOne.slice(0, 45).forEach((line, index) => {
    if (/@|https?:|www\./i.test(line.text)) {
      return
    }
    const parts = [line.text]
    for (const separator of [/\s[|•·]\s/, /\s[-–—]\s/, /\s{2,}/]) {
      if (separator.test(line.text)) {
        parts.push(line.text.split(separator)[0].trim())
      }
    }
    for (const part of parts) {
      if (/\d/.test(part)) {
        continue
      }
      const tokens = validNameTokens(part)
      if (!tokens) {
        continue
      }
      let score = 0.2
      const yFraction = line.y / pageHeight
      if (yFraction <= 0.2) {
        score += 0.25
      } else if (yFraction <= 0.4) {
        score += 0.12
      }
      const size = line.fsMax || line.fs
      if (medianSize > 0 && size >= medianSize * 1.25) {
        score += 0.25
      }
      if (size >= maxSize * 0.98) {
        score += 0.1
      }
      if (tokens.length <= 3) {
        score += 0.15
      } else {
        score += 0.05
      }
      score += 0.15
      if (index < 3) {
        score += 0.05
      }
      if (emailLocal) {
        const hits = tokens.filter((t) => {
          const normalized = stripAccents(t.toLowerCase()).replace(/[^a-z]/g, "")
          return normalized.length >= 3 && emailLocal.includes(normalized)
        }).length
        if (hits > 0) {
          score += 0.12
        }
      }
      candidates.push({ tokens, score, part })
    }
  })
  if (candidates.length === 0) {
    return null
  }
  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  if (best.score < 0.55) {
    return null
  }
  const split = splitNameTokens(best.tokens)
  const confidence = Math.min(split.confidence, 0.4 + best.score * 0.6)
  return { first: split.first, last: split.last, confidence, source: `${split.source} ; position et taille du texte` }
}

function joinParagraph(lines) {
  let text = ""
  for (const line of lines) {
    const part = stripBullet(line.text)
    if (!text) {
      text = part
    } else if (/[a-zà-ÿ]-$/.test(text) && /^[a-zà-ÿ]/.test(part)) {
      text = text.slice(0, -1) + part
    } else {
      text += " " + part
    }
  }
  return text.replace(/\s+/g, " ").trim()
}

function looksLikeProse(text) {
  const words = wordCount(text)
  if (words < 16) {
    return false
  }
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, "")
  const lower = text.replace(/[^a-zà-ÿ]/g, "")
  if (letters.length === 0 || lower.length / letters.length < 0.7) {
    return false
  }
  if (EMAIL_REGEX.test(text)) {
    EMAIL_REGEX.lastIndex = 0
    return false
  }
  EMAIL_REGEX.lastIndex = 0
  return /[.,;]/.test(text) || words >= 25
}

export function extractBio(sections, contactTexts) {
  const summaries = sections.filter((s) => s.type === "summary" && s.lines.length > 0)
  if (summaries.length > 0) {
    const section = summaries[0]
    const text = joinParagraph(section.lines).slice(0, 1600)
    if (text.length >= 20) {
      return field(text, 0.9, `section « ${section.title} »`)
    }
  }
  const header = sections[0]
  const paragraphs = []
  let current = []
  for (const line of header.lines) {
    if (line.newBlock && current.length > 0) {
      paragraphs.push(current)
      current = []
    }
    current.push(line)
  }
  if (current.length > 0) {
    paragraphs.push(current)
  }
  const prose = paragraphs
    .map((p) => joinParagraph(p))
    .filter((text) => looksLikeProse(text) && !contactTexts.some((c) => c && text.includes(c)))
    .sort((a, b) => b.length - a.length)
  if (prose.length > 0) {
    return field(prose[0].slice(0, 1600), 0.4, "heuristique : paragraphe rédigé en haut du CV")
  }
  return field("", 0, "")
}

export function findTechnologies(text) {
  const found = []
  for (const match of text.matchAll(TECH_REGEX)) {
    const canonical = TECH_LOOKUP.get(match[1].toLowerCase()) || match[1]
    if (!found.includes(canonical)) {
      found.push(canonical)
    }
  }
  return found
}

function splitList(value) {
  return value
    .split(/\s*[,;|/·•]\s*|\s+(?:et|and)\s+/i)
    .map((v) => v.replace(/^[\s.\-–—:]+|[\s.\-–—:]+$/g, ""))
    .filter((v) => v.length > 0 && v.length <= 32)
}

const TECH_LINE = /^(?:technologies?(?:\s+utilis[eé]es)?|tech(?:nos?|\s*stack)?|stack(?:\s+technique)?|outils|tools|environnement(?:\s+technique)?|langages?|built\s+with|skills?)\s*[:：\-–]\s*(.+)$/i

function extractPeriod(text) {
  const range = PERIOD_REGEX.exec(text)
  if (range) {
    return { period: range[1].replace(/\s+/g, " ").trim(), rest: text.replace(range[0], " ").replace(/\s+/g, " ").trim() }
  }
  const single = SINGLE_DATE_REGEX.exec(text)
  if (single) {
    const value = single[1] || single[2] || single[3]
    return { period: value.trim(), rest: text.replace(single[0], " ").replace(/\s+/g, " ").trim() }
  }
  return { period: "", rest: text }
}

function isDateOnly(text) {
  const { period, rest } = extractPeriod(text)
  return period !== "" && rest.replace(/[()\[\]\s\-–—|,.:]/g, "") === ""
}

function cleanTitle(value) {
  return value.replace(/^[\s\-–—|:•·.,;()]+|[\s\-–—|:•·.,;(]+$/g, "").replace(/\s+/g, " ").trim()
}

function parseTitleLine(text) {
  let working = text
  const info = { name: "", description: "", technologies: [], period: "" }
  const dated = extractPeriod(working)
  info.period = dated.period
  working = dated.rest
  const paren = /\(([^()]{2,80})\)\s*$/.exec(working)
  if (paren) {
    const techs = findTechnologies(paren[1])
    if (techs.length > 0) {
      info.technologies.push(...techs)
      working = working.slice(0, paren.index)
    }
  }
  if (/\s[|•·]\s/.test(working)) {
    const [left, ...right] = working.split(/\s[|•·]\s/)
    working = left
    const tail = right.join(" | ")
    const techs = findTechnologies(tail)
    if (techs.length > 0) {
      info.technologies.push(...techs)
    } else if (wordCount(tail) > 4) {
      info.description = tail
    }
  }
  const colon = /^([^:：]{3,70}?)\s*[:：]\s+(.{8,})$/.exec(working)
  const dash = /^(.{3,70}?)\s[-–—]\s(.{8,})$/.exec(working)
  const delimiter = colon && wordCount(colon[1]) <= 8 ? colon : dash && wordCount(dash[1]) <= 8 && wordCount(dash[2]) >= 3 ? dash : null
  if (delimiter) {
    info.name = cleanTitle(delimiter[1])
    info.description = [delimiter[2].trim(), info.description].filter(Boolean).join(" ")
  } else {
    info.name = cleanTitle(working)
  }
  info.technologies = [...new Set(info.technologies)]
  return info
}

function looksLikeTitle(text) {
  const clean = stripBullet(text)
  const words = wordCount(clean)
  if (words === 0 || words > 12 || clean.length > 110) {
    return false
  }
  if (/[.!?]$/.test(clean) || /,$/.test(clean)) {
    return false
  }
  if (!/^[A-ZÀ-ÖØ-Þ0-9"'«\[(]/.test(clean)) {
    return false
  }
  return true
}

function looksLikeJob(entry) {
  const text = `${entry.name} ${entry.description}`.toLowerCase()
  const title = entry.name.toLowerCase()
  if (/\b(stage|stagiaire|internship|intern|cdi|cdd|alternance|apprenti|employ[eé]e?)\b/.test(title)) {
    return true
  }
  if (/\b(d[eé]veloppeu[rs]e?|developer|engineer|ing[eé]nieur|consultant|manager|technicien|assistant|analyste|analyst)\b.*\b(at|chez|@)\s+[A-ZÀ-Þ]/.test(entry.name)) {
    return true
  }
  return /\b(au sein de|chez|company|entreprise|soci[eé]t[eé])\b/.test(text) && /\b(stage|poste|mission|contrat)\b/.test(text) && entry.technologies.length === 0 && !/\b(projet|project|application|app|site|plateforme|platform)\b/.test(text)
}

function parseProjectSection(section, includeExperienceFilter) {
  const entries = []
  let current = null
  const items = section.lines
  const nonBulletTitles = items.filter((l) => !isBullet(l.text) && looksLikeTitle(l.text) && !TECH_LINE.test(l.text) && !isDateOnly(l.text))
  const delimitedBullets = items.filter((l) => isBullet(l.text) && /^[^:：]{3,70}[:：]\s+\S|^.{3,70}\s[-–—]\s.{8,}/.test(stripBullet(l.text)))
  const bulletMode = nonBulletTitles.length === 0 && delimitedBullets.length > 0
  const startEntry = (text, line) => {
    const info = parseTitleLine(stripBullet(text))
    current = { name: info.name, description: info.description, technologies: info.technologies, period: info.period, firstLine: line }
    entries.push(current)
  }
  for (const line of items) {
    const text = line.text
    const tech = TECH_LINE.exec(stripBullet(text))
    if (tech) {
      if (!current) {
        startEntry("Projet", line)
        current.name = ""
      }
      for (const item of splitList(tech[1])) {
        const canonical = TECH_LOOKUP.get(item.toLowerCase()) || item
        if (!current.technologies.includes(canonical)) {
          current.technologies.push(canonical)
        }
      }
      continue
    }
    if (isDateOnly(text)) {
      if (current && !current.period) {
        current.period = extractPeriod(text).period
        continue
      }
    }
    if (bulletMode) {
      if (isBullet(text)) {
        startEntry(text, line)
      } else if (current) {
        current.description = (current.description + " " + text).trim()
      }
      continue
    }
    if (isBullet(text)) {
      if (!current) {
        startEntry(text, line)
      } else {
        current.description = (current.description + " " + stripBullet(text)).trim()
      }
      continue
    }
    if (!current) {
      startEntry(text, line)
      continue
    }
    const previous = current.lastLineText || ""
    const hasDescription = current.description.length > 0
    const withDate = extractPeriod(text).period !== "" && wordCount(text) <= 14
    const titleLike = looksLikeTitle(text)
    const previousWasBullet = isBullet(previous)
    const startsNew =
      (line.newBlock && titleLike && (hasDescription || current.technologies.length > 0)) ||
      (withDate && titleLike && hasDescription) ||
      (hasDescription && titleLike && (previousWasBullet || /[.!?]$/.test(previous)) && wordCount(text) <= 9)
    if (startsNew) {
      startEntry(text, line)
    } else if (!hasDescription && current.name && /^[a-zà-ÿ]/.test(text) && !current.name.endsWith(".") && wordCount(current.name) < 8 && current.lineCount === undefined) {
      current.name = cleanTitle(current.name + " " + text)
      current.lineCount = 2
    } else {
      current.description = (current.description + " " + text).trim()
    }
    current.lastLineText = text
  }
  const projects = []
  for (const entry of entries) {
    if (!entry.name && !entry.description) {
      continue
    }
    const inferred = findTechnologies(entry.description)
    const technologies = entry.technologies.length > 0 ? [...new Set(entry.technologies)] : inferred
    const project = {
      name: entry.name,
      description: entry.description.replace(/\s+/g, " ").trim(),
      technologies,
      period: entry.period
    }
    if (includeExperienceFilter && looksLikeJob(project)) {
      continue
    }
    let confidence = 0.55
    if (project.name && wordCount(project.name) <= 8) {
      confidence += 0.1
    }
    if (project.description) {
      confidence += 0.1
    }
    if (entry.technologies.length > 0) {
      confidence += 0.1
    } else if (inferred.length > 0) {
      confidence += 0.05
    }
    if (project.period) {
      confidence += 0.05
    }
    project.confidence = Math.min(0.88, Math.round(confidence * 100) / 100)
    projects.push(project)
  }
  return projects
}

export function extractProjects(sections) {
  const projectSections = sections.filter((s) => s.type === "projects" && s.lines.length > 0)
  const projects = []
  for (const section of projectSections) {
    const mixed = /exp[eé]rience/i.test(stripAccents(section.title))
    projects.push(...parseProjectSection(section, mixed))
  }
  return { items: projects, sectionFound: projectSections.length > 0 }
}

export function parseCv(extraction) {
  const warnings = []
  const lines = prepareLines(extraction.lines || [])
  const noText = lines.length === 0 || extraction.characters < 40 * Math.max(1, extraction.analyzedPages || 1)
  if (noText) {
    warnings.push(
      extraction.scanned
        ? "Ce PDF semble être un scan : il ne contient aucun texte sélectionnable. L'OCR n'est pas disponible dans cette application, les champs texte n'ont donc pas pu être extraits. Vous pouvez saisir les informations manuellement et sélectionner la photo sur la page."
        : "Aucun texte exploitable n'a été trouvé dans ce PDF. Les champs peuvent être saisis manuellement."
    )
  }
  const sections = buildSections(lines)
  const email = extractEmail(lines)
  const phone = extractPhone(lines)
  const name = extractName(lines, email.value, extraction.pages)
  const contactTexts = [email.value, phone.value].filter(Boolean)
  const bio = extractBio(sections, contactTexts)
  const projects = extractProjects(sections)
  if (!noText && !name) {
    warnings.push("Le nom n'a pas pu être déterminé de façon fiable : veuillez le renseigner manuellement.")
  }
  if (!noText && !projects.sectionFound) {
    warnings.push("Aucune section de projets n'a été identifiée dans ce CV.")
  }
  const fullName = name ? [name.first, name.last].filter(Boolean).join(" ") : ""
  return {
    firstName: field(name ? name.first : "", name ? name.confidence : 0, name ? name.source : ""),
    lastName: field(name ? name.last : "", name ? name.confidence : 0, name ? name.source : ""),
    fullName,
    email,
    phone,
    bio,
    projects: projects.items,
    projectsSectionFound: projects.sectionFound,
    warnings,
    noText
  }
}

export function confidenceLevel(value) {
  if (value >= 0.8) {
    return "high"
  }
  if (value >= 0.5) {
    return "medium"
  }
  return "low"
}
