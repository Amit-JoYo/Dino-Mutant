# דִּינוֹ-מוּטַנְט (Dino Mutant)

A free, offline-first Hebrew learning game for early 2nd graders. Instead of timers and grinding, dinosaurs are earned by solving math puzzles and reading school stories aloud, word by word.

**Play:** https://amit-joyo.github.io/Dino-Mutant/

No ads, no purchases, no accounts. Progress stays on the device (`localStorage`). The only optional exception is class sharing, which a parent has to turn on and which shares just a first name and up to 3 chosen dinos (see below).

## Features

- **Lab (מַעְבָּדָה):** procedural 2nd-grade math puzzles with full nikud: bridging 10, tens and units, missing addend, word problems, and word practice. Includes a drag-and-drop egg counting board and text-to-speech (he-IL).
- **Reading (קְרִיאָה):** karaoke-style reading, word by word, with a highlighted active word, per-word and per-paragraph read-aloud, and an optional microphone check. Each paragraph earns DNA and a small dino upgrade; finishing a story unlocks that story's own legendary dino (shown on its card). Reading a finished story again earns a small daily bonus and an egg; eggs hatch after an hour into baby dinos that can be dressed, and a dino whose 3 babies have all hatched evolves into a "מֵגָה" form.
- **Trail (מַסָּע):** a side-scrolling expedition with 3 obstacles per trip. Clear each with the dino's special ability or by solving a puzzle.
- **World (הָעוֹלָם):** the whole herd lives on one screen: wandering, eating, playing, sleeping, splashing and visiting each other, with day and night following the device clock. Tap a dino to feed, play, put to sleep, wash, hug, rename, or dress it. Needs decay slowly but never drop below a floor, so dinos get sad but never die.
- **Dress-up:** 63 items in 6 slots (hats, clothes, glasses, neck, back, tail), bought with DNA.
- **My Park (הַגַּן שֶׁלִּי):** 15 dino species, each with a legendary version, plus a shop for new ones.
- **Picture cards:** share a dino card or a progress card to WhatsApp as an image.
- **Parent mode (מַצַּב הוֹרִים):** behind a small multiplication gate. Paste, edit and delete stories from school, set custom practice words, or reset progress.
- **Class sharing (optional, off by default):** with Firebase configured, a parent can enable it, join a class by code with the child's first name, choose up to 3 dinos to show, and delete all online data at any time. Classmates' dinos then visit in a "הַכִּתָּה" view of the World tab, where kids can send emoji reactions and gift a copy of a dino (one a day). Only a first name and the chosen dinos are shared: no chat, pictures or personal details. The owner manages classes and names from `admin.html`. See `plan.md` section 8 for setup.

## Run locally

It is plain HTML, CSS and JavaScript with no build step. Serve the folder with any static server:

```
npx http-server -p 8080
```

Then open http://localhost:8080. The service worker only registers over http(s), not `file://`. Class sharing and `admin.html` also need http(s).

## Class sharing setup (optional)

Class sharing is off until a Firebase config is present in `js/firebase-config.js`. Everything else works without it. To set it up on your own Firebase project (free Spark plan):

1. Create a Firebase project, enable **Anonymous** and **Google** sign-in, and create a Firestore database.
2. Add your site's domain under Authentication → Settings → Authorized domains. If you restrict the API key, allow `https://<your-project>.firebaseapp.com/*` as well as your site.
3. Paste the web app config into `js/firebase-config.js` and bump `CACHE` in `sw.js`.
4. Publish `firestore.rules` (Firestore → Rules).
5. Open `admin.html`, sign in with Google, copy the uid it shows and create a document `admins/<uid>` in Firestore. Then create a class and post its code to parents.

If a phone cannot connect, open `diag.html` and run the step-by-step test. Full design and limits are in `plan.md` section 8.

## Adding stories

Add entries to `stories.json`. Each needs an `id`, a `title`, and either `text` (one paragraph per line) or a `paragraphs` array. Use full nikud. Each paragraph read earns DNA, so keep paragraphs to one or two sentences. Optional `legend` is the species id whose legendary dino the story unlocks: `trex`, `brachio`, `trike`, `ptero`, `stego`, `anky`, `raptor`, `para`, `spino`, `plesio`, `compy`, `igua`, `diplo`, `dilo` or `pachy`. Stories without it unlock the next missing legendary. Stories are fetched network-first, so new ones appear without an app update.

## Project layout

| File | Purpose |
|---|---|
| `index.html`, `css/style.css` | UI, RTL layout, animations |
| `js/app.js` | State, tabs, lab, park, parent menu |
| `js/renderer.js` | SVG dino rigs (15 species) and animations |
| `js/wardrobe.js` | Dress-up items and where they attach to each species |
| `js/nursery.js` | Eggs, hatching, baby dinos and the Mega evolution |
| `js/world.js` | The world scene, pet care and the class view |
| `js/share.js` | WhatsApp picture cards (canvas to PNG) |
| `js/cloud.js` | Class sharing: join, sync, classmates, reactions, gifts |
| `js/social.js` | Reaction and gift screens |
| `js/fsrest.js` | Small Firestore client over HTTPS |
| `js/firebase-config.js` | Firebase web config (not secret; empty = sharing off) |
| `admin.html`, `js/admin.js` | Owner-only class admin page |
| `diag.html`, `js/diag.js` | Connection self-test |
| `firestore.rules` | Security rules to publish in the Firebase console |
| `js/puzzles.js`, `js/manipulatives.js` | Math and word puzzles, egg counting board |
| `js/reading.js` | Karaoke reader and rewards |
| `js/expedition.js` | Trail mode |
| `sw.js`, `manifest.json` | Offline cache and install-to-home-screen |

When changing cached files, bump `CACHE` in `sw.js` so installed copies update.

## Install on a phone

Open the link in Chrome on Android, then menu → **Add to Home screen**. After the first load it works offline.
