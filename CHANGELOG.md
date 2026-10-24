# Changelog

## 2026-10-25: Dino Town, part 5: stars, decorations and what each building does

### Added
- **⭐ Town stars open new lots.** Stars (3 per building, 1 per room, upgrade or floor) are shown next to the World title with the next goal ("⭐ 12 · 🔓 16"). Lot 7 opens at 10 stars, then every 6 stars more (up to 100 for the last lot). Locked lots show how many stars they need. Older saves get the lots their stars already earned.
- **Decorations:** the 🌷 button on the map opens 12 decorations (flowers, sunflower, trees, balloons, chair, mailbox, lantern, tent, statue, fountain, rainbow; 3-20 DNA). Tap the grass to place one, as many as she likes; tap a placed one to take it back (full refund). Lanterns glow at night.
- **Send a dino to a room from the map:** the new "🏠 לְחֶדֶר" button in a dino's care panel lists every room with space; rooms that fix its lowest need are marked ✨.
- **What each building does:**
  - **School** (classroom, art room): "📝 שִׁעוּר" gives a Lab puzzle. A right answer earns the same DNA as the lab, and every student dino gets a heart.
  - **Library** (reading corner, story time): reading any story paragraph gives every dino sitting there a heart. A button jumps straight to the Reading tab.
  - **Shops** (mall checkout, clothes and toy shops, ice-cream stand, popcorn stand): "🪙 לְשַׂחֵק בַּקֻּפָּה" is a till game. The item costs 3-20 ₪ and she pays exactly that with 1, 2, 5 and 10 coins (too much → try again; she sees how much is still missing). +3 DNA per customer. Needs a seller dino in the shop.
  - **Hospital egg room:** a dino that goes in has its eggs hatch 1.5-2.5× sooner (once per egg), and the card shows the countdowns.
  - **Farm → restaurant:** dinos in the chicken coop, cowshed and vegetable patch make 🥚 🥛 🥕 over time; she collects them into the store room. In the restaurant's dining room, "🍳 אֲרוּחַת חַוָּה" gives every diner a farm meal (+30 food, +1 heart).
  - **Fire station rescue room:** "🚨 יוֹצְאִים לְהַצָּלָה" is a small scene (a cat, kitten or chick is stuck): tap the ladder, then the animal. Hearts for the firefighters; once an hour.
  - **Museum:** the fossil hall shows a short fact (full nikud, 🔊) about every species she owns; the legends hall shows her legendary dinos.
- `js/town-fun.js`: the building features.

### Changed
- Service worker cache bumped to `v26`.

## 2026-10-25: Dino Town, part 4: dinos in rooms

### Added
- **Put dinos in rooms.** Tap a room, then "➕ לְהַכְנִיס דִּינוֹזָאוּר" and pick one of her dinos. The list shows where each dino is now (outside, or which room) and blinks the need it is lowest on. A room fits as many dinos as its stars (1-3). A dino can move from room to room, and "🌳 הַחוּצָה" sends it back outside.
- **They go inside for real:** on the map the dino (and its babies) walks to the building's door and goes in. Buildings show "🦖 2" for how many dinos are inside, and the counter above the map says how many are in buildings. Sending a dino out makes it come out of the door.
- **Inside, dinos do the room's activity:** sleeping in the bedroom, eating in the dining room, splashing in the pool, cooking, playing, cuddling animals. Their hatched babies are with them.
- **Rooms look after needs, even while the app is closed:** bedrooms refill energy, dining rooms food, bathrooms/pools cleanliness, play rooms fun, and the doctor's room a bit of everything. Working rooms (cooking, shops, the farm, the fire station and more) and learning rooms add fun and ❤️ hearts. Higher-star rooms work faster, and a dining room works 1.5× faster when a chef is in that building's kitchen. Other needs still go down, so it is worth moving dinos around.
- The room card says what the room does and lists who is inside.

### Changed
- Service worker cache bumped to `v25`.

## 2026-10-25: Dino Town, part 3: inside the buildings

### Added
- **Tap a building to go inside.** A full-screen side view shows its floors, with 2 rooms per floor, the building's own colours and roof, and the door at the bottom.
- **Build rooms:** tap ➕ on an empty spot and choose from that building's rooms (4 per building, 2-3 for the cinema, library, fire station and museum, 43 in all). Each room has its name with full nikud (🔊 reads it), what dinos do there (sleep, eat, cook, play, wash, care, learn, look after animals, work) and a price of 20-35 DNA. The same room can be built more than once (for example, a house with 3 bedrooms).
- **Upgrade rooms** up to ⭐⭐⭐. Each level adds furniture and space for one more dino (used in the next update), and a 3-star room gets a gold frame.
- **More floors:** when every room is full, a 2nd floor (25 DNA) and a 3rd floor (40 DNA) can be added. Parks and pools get more "areas" instead of floors.
- Each new room, upgrade and floor is +1 ⭐ town star.
- `js/town-inside.js`: the inside view. Saved buildings are checked on load (valid room types, slots and levels).

### Changed
- Service worker cache bumped to `v24`.

## 2026-10-25: Dino Town, part 2: building

### Added
- **Build on the town lots with DNA.** Tap an open lot (🏗️) to see all 12 buildings: house 30, park 50, restaurant 60, farm 60, pool 70, school 80, library 80, hospital and vet 90, mall 100, cinema 110, fire station 120 and museum 150 DNA. Each one has its own front, a description with full nikud, and 🔊 read-aloud.
- **The builder's question:** before the building goes up, the builder asks a short building-themed maths question (windows, bricks, paint buckets, floors). A wrong answer just tries again, with a hint after two tries. DNA is only paid once the question is answered, and she can go back without paying.
- **Construction:** the building rises out of the ground with a crane and dust, nearby dinos cheer 🎉, and a celebration screen follows. Windows light up at night. Tapping a building shows its card. Going inside to build rooms comes next.
- Each building is +3 ⭐ town stars (saved now; they will open more lots later). The mini-map shows buildings in their colours.
- `js/town-data.js`: the building catalog and SVG fronts.

### Changed
- Service worker cache bumped to `v23`.

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
