# Changelog

## Unreleased

### Fixed
- Class sharing and the admin page no longer use the Firebase library's own database connection, which hangs on some phones and networks. Data now goes over plain HTTPS (`js/fsrest.js`); the library is used only for signing in. Connection problems now show a message naming the step that failed instead of waiting forever.
- Added `diag.html`, a step-by-step connection test page for troubleshooting.

### Added
- **Picture cards for WhatsApp:** share a dino card (care panel) or a progress card ("הַגַּן שֶׁלִּי") as an image, through the phone's share sheet or as a download. Works without any server.
- **Emoji reactions:** send 👋 ❤️ 🎉 ⭐ to a classmate's visiting dino. The classmate sees who sent it above their dinos.
- **Gifts:** give a classmate a copy of one of your dinos (you keep yours). One gift per day; legendaries, the starter T-Rex and received gifts can't be gifted. Received dinos show "🎁 מַתָּנָה" in the park.
- `firestore.rules` extended for reactions and gifts (publish it again).
- **Class world:** once a child has joined a class, the World tab gets a "הַכִּתָּה" toggle showing classmates' showcased dinos (with their first names) wandering together. Visiting dinos can be fed, played with and hugged but never changed, and refresh every 45 seconds. Data from the server is re-validated before drawing.
- **Class sharing groundwork (off until configured):** parent-mode consent switch, join a class by code with a first name, choose up to 3 dinos to show, rename, leave, and delete all online data. Backed by Firebase (anonymous auth + Firestore).
- `admin.html` for the owner: create and switch off classes, rename, lock or remove members.
- `firestore.rules` with per-class access, no listing of classes, and locked names.

### Changed
- Service worker cache bumped to `v8`.

## 2026-10-19

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
