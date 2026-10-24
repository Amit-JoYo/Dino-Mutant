# Changelog

## 2026-10-25: Dino Town, part 1: the big map

### Added
- **A much bigger World:** the meadow is now the top-left corner of a map about 4 screens wide and 3 screens tall. Swipe to scroll on a phone, or drag with the mouse on a computer. The map has streets, trees and flowers, and 22 building lots: 6 are open (🏗️) and the rest are locked (🔒) until later. Building on them comes in the next update; for now, tapping a lot just shows a "coming soon" message.
- A **mini-map** in the corner shows where the dinos are and which part of the map is on screen. Tap it to jump there. The 🏡 button goes back to the meadow.
- Dinos sometimes stroll into town to look around, then wander back home to the meadow.
- `js/town.js`: map layout and the new `town` save data (stars, open lots, buildings). Old saves get it automatically.

### Changed
- Positions in the World use map units instead of screen percentages, and the World is a bit taller on phones.
- Service worker cache bumped to `v22`.

## 2026-10-21: 11 new stories and 5 new dinos

### Added
- **Eggs and baby dinos:** every dino can have up to 3 eggs. Re-reading a finished story gives +1 DNA per paragraph and, at the end, +10 DNA and an egg (once per story per day) for the story's dino, or another dino with room if that one is full. The small eggs that reading already gave next to a dino are now real eggs too. An egg hatches after 1 hour (real time) into a baby of the same species, with big eyes, in its own eggshell. The baby looks like its parent's previous colour: every time the parent mutates, the babies take its old form. Babies show in the lab (a nursery strip with countdowns), wander next to their parent in the World, and can each be dressed separately. Old saves keep their eggs, which now hatch an hour after the update.
- **Dino evolution:** when all 3 babies of a dino have hatched, it evolves into a "מֵגָה" form with a glowing aura and orbiting sparkles, plus +30 DNA. Evolved dinos are shown to classmates and on share cards, and can't be gifted.
- **11 new stories** (family photo, desert floods, snow in the Galilee, alone in the rain, growing vegetables, class garden a/b, class guest a/b, nature photographer, the concert).
- **5 new dinos:** Compsognathus, Iguanodon, Diplodocus, Dilophosaurus and Pachycephalosaurus, each with a legendary version, wardrobe positions and a favorite food. 15 species in total.
- **Each story now has its own legendary dino** (`legend` in `stories.json`), shown on the story card as a silhouette until it is earned. If she already has it, finishing the story gives the next legendary she is missing.
- The progress card now fits all 15 species.

### Changed
- `firestore.rules`: the gift whitelist includes the 5 new species. **Publish the rules again**, otherwise gifting a new species is denied.
- Service worker cache bumped to `v21`.

## 2026-10-19 (evening): class sharing

### Fixed
- Class sharing and the admin page no longer use the Firebase library's own database connection, which hangs on some phones and networks. Data now goes over plain HTTPS (`js/fsrest.js`); the library is used only for signing in. Connection problems now show a message naming the step that failed instead of waiting forever.
- Admin page: every action (remove, rename, unlock, switch a class on or off, create) now shows a red error line if it fails, instead of doing nothing. Members are removed with the same request type as joining.
- Added `diag.html`, a step-by-step connection test page for troubleshooting.
- Parent mode now shows the app version at the bottom ("גִּרְסָה") so a stale cached copy is easy to spot.

### Added
- **Picture cards for WhatsApp:** share a dino card (care panel) or a progress card ("הַגַּן שֶׁלִּי") as an image, through the phone's share sheet or as a download. Works without any server.
- **Emoji reactions:** send 👋 ❤️ 🎉 ⭐ to a classmate's visiting dino. The classmate sees who sent it above their dinos.
- **Gifts:** give a classmate a copy of one of your dinos (you keep yours). One gift per day; legendaries, the starter T-Rex and received gifts can't be gifted. Received dinos show "🎁 מַתָּנָה" in the park.
- `firestore.rules` extended for reactions and gifts (publish it again).
- **Class world:** once a child has joined a class, the World tab gets a "הַכִּתָּה" toggle showing classmates' showcased dinos (with their first names) wandering together. Visiting dinos can be fed, played with and hugged but never changed, and refresh every 45 seconds. Data from the server is re-validated before drawing.
- **Class sharing (off until configured):** parent-mode consent switch, join a class by code with a first name, choose up to 3 dinos to show, rename, leave, and delete all online data. Backed by Firebase (anonymous sign-in; data over HTTPS).
- `admin.html` for the owner (Google sign-in, works on phones): create and switch off classes, rename, lock or remove members.
- `firestore.rules` with per-class access, no listing of classes, and locked names. Publish it in the Firebase console after every change.

### Changed
- Service worker cache bumped to `v18`.

## 2026-10-19 (earlier): world, care and dress-up

### Added
- **World tab:** the whole herd wanders, eats, plays, sleeps, splashes and visits each other, with a day/night scene.
- **Pet care:** tap a dino to feed (6 foods, each dino has a favorite), play, put to sleep, wash, hug, or rename it. Stats decay slowly but never drop below a floor.
- **Dress-up:** 63 wearable items across 6 slots. Outfits show everywhere a dino appears.
- **6 new dinos:** Stegosaurus, Ankylosaurus, Velociraptor, Parasaurolophus, Spinosaurus, Plesiosaur. Each has a legendary version.
- **4 new dino colors.**
- **3 new trail obstacles** (thorns, canyon, bats) and 4 new abilities (armor, speed, swim, roar). Rivers can now be crossed by flying or swimming.

### Changed
- Service worker cache bumped to `v7`.

## 2026-10-18

### Added
- Two new stories.
- Parent menu: edit saved stories.

### Initial release
- Math puzzles, karaoke reading, egg counting board, trail mode, park, parent mode, and offline PWA support.
