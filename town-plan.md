# Dino Town: plan

Dino Town turns the World tab into a big map where the child builds a town with the DNA she earns from reading and puzzles, then puts her dinos in rooms, Fallout Shelter style. The basic ideas don't change: DNA only comes from learning, nothing is ever lost or dies, all text has full nikud and can be read aloud, and phone in portrait comes first.

## Done (October 2026)

| Part | What it adds | Main files |
|---|---|---|
| 1. Big map | The World is a 400 × 300 unit map (about 4 × 3 phone screens). It scrolls by touch, mouse drag, mini-map or the 🏡 button. The meadow is the top-left corner. Streets and 22 lots. Dinos stroll into town and back. | `js/town.js`, `js/world.js` |
| 2. Building | 12 buildings (30-150 DNA): a catalog with 🔊, one builder's maths question before building, a construction animation, windows that light up at night. | `js/town-data.js`, `js/town.js` |
| 3. Inside | A side view of floors with 2 rooms each, up to 3 floors (25/40 DNA). 43 room types (20-35 DNA), upgrades up to ⭐⭐⭐ (more furniture, more space). | `js/town-inside.js` |
| 4. Dinos in rooms | Put a dino in a room: it walks in with its babies and does the room's activity. Rooms raise needs instead of letting them drop (works offline too). A chef makes the dining room 1.5× faster. "🦖 N" badges on buildings. | `js/town.js`, `js/town-inside.js`, `js/world.js` |
| 5. Stars and features | ⭐ stars (3 per building, 1 per room, upgrade or floor) open lots (10, then +6 per lot). 12 decorations placed freely, refunded when taken back. "🏠 לְחֶדֶר" from the care panel. Building features: school lessons, library listening, shop till (pay the exact price), egg room, farm goods → restaurant meals, fire rescues, museum facts and legends hall. | `js/town-fun.js`, `js/town.js`, `js/world.js` |

Save data is `state.town`: `{ v, stars, lots, buildings[{ lot, type, floors, rooms[{ slot, type, lvl, goods, gt }], lastRescue }], jobs{ uid: { lot, slot } }, decor[{ id, x, y }], pantry{ egg, milk, veg } }`. `Town.migrate()` checks it on every load.

## Next: check on a real phone

Before adding more, watch her play for a few days and note:

- **DNA prices:** is it too tight or too easy? Buildings cost 30-150, rooms 20-35 (upgrades ×1 and ×1.6), floors 25/40, decorations 3-20. The numbers are in `js/town-data.js`.
- **Room speed:** do needs fill too fast or too slow? Rooms give +14/hour (×1.25 per star above 1), the doctor +4/hour to everything, and work and learning add hearts. See `Town.jobEffect()`.
- **Star pace:** lots open at 10 stars, then every 6 more (`lotNeed()` in `js/town-data.js`).
- **Map feel:** size, scrolling, and whether anything is too small to tap.
- **Speed on older phones** with many buildings, decorations and dinos. Only dinos outside are drawn on the map, but every room card draws SVG dinos.

## Ideas for later

Each one stands alone, roughly in order of fun for effort.

### Job hats
While a dino works in a room, it wears a matching hat: chef hat in the kitchen, helmet at the fire station, cap at school. Reuse the existing wardrobe items where possible (`chef`, `grad`) and add a few (fire helmet, nurse cap, lifeguard visor). Show it only inside the building, without changing the dino's own outfit.

### Pool and cinema features
- **Pool:** a short swimming race. Dinos in the pool swim across, and she taps to cheer one on, or answers a quick question to give it a boost. Hearts for everyone, and a small DNA reward only when it includes a question.
- **Cinema:** "the movie". It picks a story she has already finished and reads the first paragraph aloud while the dinos in the hall watch, or she reads it karaoke style. The dinos in the hall get hearts, the same way as the library.

### Daily town tasks
Three small goals a day, for example "feed 3 dinos in the restaurant", "sell 2 items at the till", "read one paragraph to the library". Each finished task gives +2 ⭐ (stars, not DNA). Tasks change at midnight, with no penalty for missing them.

### Move or sell a building
- **Move:** pick an empty open lot, and the building moves there with its rooms and dinos.
- **Sell:** get half the DNA back for the building and its rooms. Dinos inside go back outside. Ask for confirmation ("בטוח?") with a big picture of the building, so it doesn't happen by accident.

### Visit a classmate's town (class mode)
In the class view, a "🏙️ the town of…" button shows a classmate's buildings, read-only: no rooms, no names of dinos inside. This needs:
- A small public summary of the town in the cloud (building types and lots only), written only when the parent has turned class sharing on.
- An update to `firestore.rules` that allows only that field, with size limits, and the new rules published.
- Updating "delete all online data" to remove it too.

### Smaller extras
- Dinos that stroll into town sometimes sit on a bench or by the fountain she placed.
- Night mode: lanterns and windows light up more, and dinos in bedrooms show 💤 on the building.
- A "town card" to share on WhatsApp, like the existing dino and progress cards.
- Seasons or holidays (Hanukkah lights, Purim balloons) as free time-limited decorations.
