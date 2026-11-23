# Wordlings

An English game for a 7-year-old who understands spoken English but can't read it yet. It is a separate app from the dino game, in this folder: <https://amit-joyo.github.io/Dino-Mutant/wordlings/>.

## How it plays

- She walks a top-down map like the Game Boy Pokémon games (arrow pad on screen, arrow keys or WASD on a PC, **A** or Space to read a sign). A little buddy, the first creature she caught or the one she picks in the book, follows behind her.
- Stepping into **tall grass** can start an encounter (about one in five steps, never in the first 3 steps after the last one). The place decides which creatures and words appear.
- A wild creature asks for something out loud ("I'm hungry! I want an apple, please."). She taps the right picture (or, for words she already knows, the Hebrew meaning). Three right answers make the creature her friend and she catches it with a Wordball.
- A wrong answer greys the card out and says the word she tapped, then the word she was asked for. She can try again, and missed words come back later in the same encounter. Every word is said once.
- A repeat catch makes the creature stronger: level up every 8 points, evolution at level 3 and level 6.
- The village has three buildings you can walk into through their doors: **The Bakery** (food words: apple, bread, cheese…), **My House** (room words: bed, chair, TV, clock…) and **The Rainbow Shop** (colours and numbers). Inside, the creatures hide on rugs instead of in tall grass, and the exit mat takes her back to the door. Outside, the forest has the animal and nature words.
- A door stays **locked** until she has caught 2, 4 and 6 creatures; the sign next to each door and the furniture inside can be read with A (in English and Hebrew).
- Tabs: the walk, the creature book, and the word list with stars for how well each word is known.

## Files

| File | Purpose |
| --- | --- |
| `js/world.js` | The walking world: map generation, pixel tiles, the walking character and buddy, gates, signs, encounter triggers |
| `js/creatures.js` | The 12 creatures as SVG (shapes, ears, tails, crests, 3 evolution stages) |
| `js/words.js` | Places and words (English, Hebrew with nikud, how it is said in a sentence, picture) |
| `js/audio.js` | English speech from the device's voices and small sound effects |
| `js/game.js` | Progress (saved in `localStorage` as `wordlings-v1`, including her position), the encounter loop, the book and the word list |

## Adding words

Add a line in `js/words.js`: `n('tree', 'עֵץ', '🌳')` for a picture word (add `'a tree'` as the last argument when the sentence needs a different article), `col(...)` for a colour or `num(...)` for a number. A zone needs at least 3 words of the same kind.

## Ideas for later

Battles, a trainer or two to meet on the road, better audio (recorded or neural voices), more places, and a spelling game.
