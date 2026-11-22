# Wordlings

An English game for a 7-year-old who understands spoken English but can't read it yet. It is a separate app from the dino game, in this folder: <https://amit-joyo.github.io/Dino-Mutant/wordlings/>.

## How it plays

- Pick a place on the map. A wild creature appears and asks for something out loud ("I'm hungry! I want an apple, please.").
- She taps the right picture (or, for words she already knows, the Hebrew meaning). Three right answers make the creature her friend and she catches it with a Wordball.
- A wrong answer greys the card out and says the word she tapped, then the word she was asked for. She can try again. Words she missed come back later in the same encounter.
- A repeat catch makes the creature stronger: level up every 8 points, evolution at level 3 and level 6.
- 4 places (forest, kitchen, house, colours and numbers), 52 words, 12 original creatures. The next place opens after catching 2, 4 and 6 creatures.
- Tabs: the map, the creature book, and the word list with stars for how well each word is known.

## Files

| File | Purpose |
| --- | --- |
| `js/creatures.js` | The 12 creatures as SVG (shapes, ears, tails, crests, 3 evolution stages) |
| `js/words.js` | Places and words (English, Hebrew with nikud, how it is said in a sentence, picture) |
| `js/audio.js` | English speech from the device's voices (a lone word is said twice, slowly) and small sound effects |
| `js/game.js` | Progress (saved in `localStorage` as `wordlings-v1`), the encounter loop, the book and the word list |

## Adding words

Add a line in `js/words.js`: `n('tree', 'עֵץ', '🌳')` for a picture word (add `'a tree'` as the last argument when the sentence needs a different article), `col(...)` for a colour or `num(...)` for a number. A zone needs at least 3 words of the same kind.

## Ideas for later

Battles, better audio (recorded or neural voices), more places, and a spelling game.
