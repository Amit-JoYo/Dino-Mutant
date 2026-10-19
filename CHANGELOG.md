# Changelog

## Unreleased

### Added
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
