# Wordlings

An English game for a 7-year-old who understands spoken English but can't read it yet. It is a separate app from the dino game, in this folder: <https://amit-joyo.github.io/Dino-Mutant/wordlings/>.

## How it plays

- She walks a top-down map like the Game Boy Pokémon games (arrow pad on screen, arrow keys or WASD on a PC, **A** or Space to read a sign). A little buddy, the first creature she caught or the one she picks in the book, follows behind her.
- Stepping into **tall grass** can start an encounter (about one in five steps, never in the first 3 steps after the last one). The place decides which creatures and words appear.
- A wild creature asks for something out loud. Each fight has three questions and each one is worded differently ("I'm hungry! I want an apple, please." / "Can I have an apple, please?" / "Mmm! Where is an apple?"), so she hears several ways to ask. She taps the right picture (or, for words she already knows, the Hebrew meaning). Three right answers make the creature her friend and she catches it with a Wordball.
- A wrong answer greys the card out and says the word she tapped, then the word she was asked for. She can try again, and missed words come back later in the same encounter. Every word is said once.
- A repeat catch makes the creature stronger: level up every 8 points. At level 3 and level 6 it **evolves into a new form** with its own name and a different body (the shape, ears and tail change, and it grows wings, horns, a mane, spikes, a cape or a forehead gem, see `FORMS` in `js/creatures.js`). She sees the old form glow white and change. The creature card shows the three forms, with the ones she has not reached yet as shadows.
- The village has three buildings you can walk into through their doors: **The Bakery** (food words: apple, bread, cheese…), **My House** (room words: bed, chair, TV, clock…) and **The Rainbow Shop** (colours and numbers). Inside, the creatures hide on rugs instead of in tall grass, and the exit mat takes her back to the door. Outside, the forest has the animal and nature words.
- A door stays **locked** until she has caught 3, 7 and 11 different creatures (20 creatures and 80 words in all, 5 creatures and 20 words per place); the sign next to each door and the furniture inside can be read with A (in English and Hebrew).
- **Every building has three floors.** The stairs up (next to the back wall) open when she knows 12 words on the ground floor and 10 on the second floor; until then they show a padlock. Each floor is harder than the one below:
  - Floor 1: single words ("Can you find a cow?").
  - Floor 2: more words, said in longer polite sentences, and in the Rainbow Shop two-word phrases ("the red circle", "the blue square"). The wrong answers look like the right one (same colour or same shape), so she has to hear all of it.
  - Floor 3: she is asked little questions instead of for the word ("What do we use to eat soup?", "What colour do we get if we mix blue and yellow?", "What is five plus five?"). Words on these floors have a `clue` list, made with `ask(...)` in `js/words.js`.
  - Each upper floor has one new creature that lives only there (26 creatures in all).
- **People with quests** stand in the village and on every floor (10 in all). A "!" over their head means they have a quest for her, a "?" means she can go back and tell them she is done. Press A in front of them. Each has a short chain of quests, one at a time: an **order** (a listening game: they ask for two or three things in one sentence, she taps them), **make new friends** in their room, **evolve** a creature, or **read** a sign. Quests give stars. The Quests tab lists everyone and how far she got. Progress is saved in the main save (`state.quests`).
- **Trainers and friendly duels.** 11 trainers stand beside the road and in the rooms (the first ones at the village road, then one on every floor of every building). When she walks into the line a trainer is looking along, they shout "!", walk up to her and ask for a duel. She picks which of her creatures fights, then answers the usual questions: a right answer is an attack from her creature, a wrong answer is a hit from theirs. A bigger evolved form has more hearts (5 / 7 / 9) and hits harder (1 / 2 / 3), so evolving matters. Nothing is lost for good by losing, but the creature that lost **faints**: it is greyed out in the book and in the fighter picker, and its walking buddy sleeps on the map with a "z". She can fight on with another friend, or take the tired ones to **the Hospital** (a fourth building on the road near the start, always open). Nurse Noa asks for two things in one sentence ("I need an ambulance and a doctor, please!"), she taps them, and all tired creatures are healed. If every creature is tired, trainers tell her to go to the hospital first. The nurse also has her own quests, and the hospital has its own 16 words (doctor, nurse, bandage, body parts…). She can say "not now" (the trainer waits until she has walked out of sight), and can press A in front of a trainer she has beaten for a rematch. Winning gives stars and experience to her fighter (it can level up or evolve right there). Beating every trainer of a place gives a badge (🌳 🥖 🏠 🎨), and all four make her the champion of the village 🏆; the badges are on the quests tab. Trainers are defined in `js/trainers.js`.
- Tabs: the walk, the creature book, the word list with stars for how well each word is known, and the quests (with the badges and the list of trainers).

## Files

| File | Purpose |
| --- | --- |
| `js/world.js` | The walking world: map generation, pixel tiles, the three floors of each building with their stairs, the walking character and buddy, the people and trainers, gates, signs, encounter triggers |
| `js/creatures.js` | The 26 creatures as SVG (shapes, ears, tails, crests, and the 3 evolved forms in `FORMS`) |
| `js/words.js` | Places and words (English, Hebrew with nikud, how it is said in a sentence, picture, and for the upper floors the questions) |
| `js/quests.js` | The people, their quests, the order game and the quest tab |
| `js/trainers.js` | The trainers, the talk before a duel, the badges |
| `js/audio.js` | English speech from the device's voices and small sound effects |
| `js/game.js` | Progress (saved in `localStorage` as `wordlings-v1`, including her position), the encounter loop, the trainer duels, the book and the word list |

## Adding words

Add a line in `js/words.js`: `n('tree', 'עֵץ', '🌳')` for a picture word (add `'a tree'` as the last argument when the sentence needs a different article), `col(...)` for a colour or `num(...)` for a number. A zone needs at least 3 words of the same kind. Each zone also has a `prompts` list: the question templates (a fight uses a different one for each of its three questions), so add a template there to add another way of asking. On the upper floors wrap the word in `ask(word, 'a question', 'another question')` to have it asked as a question; make sure no other word on the same floor is also a good answer to it.

## Adding a quest or a person

Add a person to `NPCS` and quests to `QUESTS` in `js/quests.js` (`order(...)`, `befriend(...)`, `evolve(...)`, `read(...)`). The person stands on the free tile nearest to `map`, `x`, `y`; the maps are the keys of `INTERIORS` in `js/world.js`, plus `outside`. A trainer is one more `trainer(...)` line in `js/trainers.js`; it stands exactly on `x`, `y` (the tile is cleared if needed), looks along `dir` for `sight` tiles, and its duel uses the words of `zone`.

## Ideas for later

Better audio (recorded or neural voices), a spelling game, a shop to spend stars on, and more quest kinds (a spoken "Simon says" game).
