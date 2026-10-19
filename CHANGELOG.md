# Changelog

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
