# CV Image Engine

Application Next.js (Pages Router, JavaScript, TailwindCSS) qui regroupe deux outils fonctionnant sans intelligence artificielle, sans modèle pré-entraîné et sans API externe :

1. **CV Extractor** : extraction d'informations d'un CV PDF (nom, prénom, photo, email, téléphone, biographie, projets).
2. **Image Search** : moteur de recherche d'images similaires, fondé sur la fonction d'appariement de Cantor et sur la recherche multi-échelle de sous-images.

## Installation et lancement

Prérequis : Node.js 18.18 ou plus récent (testé avec Node 22). Aucune configuration supplémentaire, aucune clé API.

```bash
npm install
npm run dev
```

Ouvrir ensuite http://localhost:3000.

Version de production :

```bash
npm run build
npm start
```

Tests automatisés :

```bash
npm test
```

## Utilisation

### CV Extractor (`/cvExtractor`)

1. Glisser un PDF dans la zone d'import (12 Mo maximum).
2. Le texte est analysé par l'API `pages/api/extractCv.js` (traitement en mémoire, aucun fichier conservé). Les images intégrées sont analysées dans le navigateur.
3. Chaque champ est modifiable et affiche un indice de confiance (élevée, moyenne, faible, non trouvé, modifié manuellement).
4. Les projets peuvent être ajoutés, modifiés et supprimés.
5. La photo peut être téléchargée en PNG, et les données en JSON.

### Image Search (`/imageSearch`)

1. Importer plusieurs images (PNG, JPEG, WebP, GIF, BMP, 15 Mo maximum chacune).
2. Cliquer sur une image pour la choisir comme référence, puis lancer la recherche.
3. Les résultats sont triés par score décroissant. Chaque carte affiche les deux images côte à côte, le score, le type de correspondance (identique, complète, partielle) et, pour une correspondance partielle, la zone retrouvée surlignée.
4. Le curseur de seuil filtre les résultats en direct.

## Fonctionnement

### Fonction de Cantor (`lib/cantor.js`)

`cantor` et `cantorReverse` sont implémentées telles que spécifiées. Un pixel RGB est encodé en deux applications successives : `cantor(cantor(R, G), B)`, et décodé par deux `cantorReverse`. La valeur maximale (255, 255, 255) vaut 2 193 664 081 280, bien en dessous de `Number.MAX_SAFE_INTEGER` : l'aller-retour est exact en `Number` sur tout le domaine RGB. Des variantes `BigInt` (`cantorBig`, `cantorReverseBig`) sont fournies pour les très grands entiers.

Cantor est utilisée dans le pipeline, pas seulement testée :

- chaque niveau de la pyramide d'une image est stocké sous forme d'un vecteur de codes de Cantor (un nombre par pixel, ordre ligne par ligne) ;
- la comparaison de deux images identiques se fait directement sur ces codes (égalité exacte) ;
- pour la recherche de sous-images, les codes sont décodés par `cantorReverse` vers les plans R, G, B et gris ;
- l'histogramme de couleurs quantifiées utilise lui aussi une clé de Cantor.

### Similarité (`lib/similarity.js`)

1. Transparence composée sur fond blanc, puis pyramide de 3 niveaux au maximum (80, 160, 320 px sur le grand côté).
2. Dans les deux sens (A dans B, puis B dans A) : filtre rapide par inclusion de couleurs, balayage grossier multi-échelle par corrélation croisée normalisée (ZNCC) avec images intégrales, puis raffinement local sur les niveaux plus fins pour les meilleures candidates.
3. Score final de la meilleure zone : structure (corrélation en gris et par canal), cohérence photométrique tolérante aux petites variations de luminosité et de couleur, et intersection d'histogrammes. Un faible score de structure plafonne le score global, ce qui évite de considérer comme similaires des images ayant les mêmes couleurs mais des arrangements différents.
4. Une zone couvrant presque toute l'image avec des proportions compatibles est une correspondance complète ; sinon, c'est une correspondance partielle avec la zone retrouvée.

Le calcul s'exécute dans un Web Worker (`lib/imageWorker.js`) pour ne pas bloquer l'interface. Les représentations et les comparaisons sont mises en cache. L'API `POST /api/searchImages` expose le même moteur côté serveur (images en RGB base64, 24 images et 400 px de côté au maximum) ; l'interface utilise le worker.

### Extraction du CV (`lib/pdfExtractor.js`, `lib/cvParser.js`)

- Texte : `pdfjs-dist`, regroupement par lignes et détection des colonnes (barres latérales).
- Sections reconnues en français et en anglais (profil, à propos, projets, réalisations, etc.).
- Nom et prénom : libellés explicites, sinon heuristiques (position, taille du texte, casse NOM / Prénom, noms composés, particules, cohérence avec l'email).
- Téléphone : formats marocains (local, `+212`, `00212`) et internationaux, avec rejet des dates, années, codes postaux et identifiants.
- Photo : analyse de la liste d'opérations PDF.js (`getOperatorList`) pour retrouver les images intégrées et leur position dans la page, puis notation selon les proportions, la taille, la position et le contenu. Les candidates sont présentées à l'utilisateur. Si aucune n'est probable, la sélection manuelle d'une zone sur la page (Canvas) sert de solution de secours.

## Sécurité et fichiers

- Validation de l'extension, du type MIME **et** de la signature réelle du fichier (octets magiques), de la taille et du nom (assaini).
- Les PDF ne sont pas écrits sur le disque : ils sont lus en mémoire par l'API puis libérés.
- Taille maximale côté serveur, méthodes HTTP et types de contenu contrôlés, erreurs explicites (400, 405, 413, 415, 422).

## Limites connues

- **Pas d'OCR** : un PDF scanné (images sans texte) est détecté et signalé ; aucun champ texte n'est inventé, il faut les saisir à la main.
- **Photo** : la détection est une estimation fondée sur des critères géométriques et colorimétriques, pas une reconnaissance de visage. Une photo n'est présentée comme « probable » que si le score est suffisant ; elle doit toujours être vérifiée. Les photos fusionnées dans l'image de fond de la page ne sont pas séparables automatiquement : la sélection manuelle sert alors de recours.
- **Extraction du texte** : les heuristiques couvrent les mises en page courantes (une ou deux colonnes). Des CV très graphiques, en tableaux imbriqués, ou dont les titres de sections sont inhabituels peuvent donner des champs vides ou de faible confiance. Le nom écrit entièrement en majuscules sans autre indice reste ambigu (prénom et nom peuvent être inversés).
- **Similarité** : la recherche couvre les changements d'échelle (environ 14 % à 100 % de la largeur du conteneur), de luminosité et de couleurs légers, et le recadrage. Elle ne gère ni les rotations, ni les symétries, ni les déformations perspectives. Les images sont ramenées à 640 px maximum avant analyse. Un petit recadrage très peu texturé (aplat) est difficile à localiser de façon fiable. Les seuils et pondérations ont été réglés sur des images de test synthétiques et peuvent demander un ajustement sur vos propres images.
- Un fichier `pdf.worker.min.js` est copié dans `public/` pour le navigateur ; il correspond à la version exacte de `pdfjs-dist` (3.11.174) épinglée dans `package.json`.

## Structure

```text
cv-image-engine/
├── components/   navbar, fileUploader, imageGallery, matchCard, progressBar, cvResult, photoSelector
├── pages/        index, cvExtractor, imageSearch, _app, _document, api/extractCv.js, api/searchImages.js
├── lib/          cantor, imageProcessor, similarity, imageWorker, pdfExtractor, cvParser
├── tests/        cantor, similarity, cv (+ générateurs de PDF et d'images de test)
├── public/       pdf.worker.min.js
└── styles/       globals.css (directives Tailwind uniquement)
```
