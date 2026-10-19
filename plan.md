Master Specification: Dino Mutant - 2nd Grade Hebrew & Math Puzzles + Karaoke Reading Storybook (PWA / Offline)

Project Overview

Build an offline-first Progressive Web App (PWA) for Android and desktop browsers titled "דִּינוֹ-מוּטַנְט: מַעְבָּדַת הַדנ״א וְסִפְُر הַקְּרִיאָה".
The game is inspired by Dino Mutant (MondayOFF) but adapted for a 7-year-old girl in early 2nd grade. It features zero commercial wait timers, replacing random stat grinds with educational puzzle gates and karaoke-style school reading quests.

Architecture & File Structure

Organize the project into the following modular file structure:

/
├── index.html            # Main UI, tabs, layout, and canvas/SVG containers
├── manifest.json         # PWA manifest for Android home screen installation
├── sw.js                 # Service Worker for 100% offline caching
├── css/
│   └── style.css         # RTL styles, animations, responsive grid layouts
└── js/
    ├── app.js            # Main controller, state management, tab switching
    ├── renderer.js       # Modular SVG / Canvas 2D skeletal dinosaur rig & animations
    ├── puzzles.js        # Procedural 2nd-grade math generator & parameterized Hebrew sentence engine
    ├── reading.js        # Karaoke word-by-word school reading reader & reward handler
    └── expedition.js     # Side-scrolling obstacle trail and reward system


Core Technical Requirements

1. Hebrew Language & Typography (direction: rtl)

All Hebrew text must include correct, full Nikud (vowel diacritics).

Use Google Fonts (Rubik or Varela Round) to ensure clean rendering of letters and diacritics on Android Chrome.

Text-to-Speech (TTS): Integrate window.speechSynthesis with he-IL so the player can tap a speaker button (🔊) to hear sentences or reading paragraphs read aloud offline.

2. Procedural 2nd-Grade Math Engine (puzzles.js)

Bridging 10 (מעבר לעשרת עד 20): Addition and subtraction crossing 10 (7 + 6 = ?, 14 - 8 = ?).

Tens & Units (עשרות ויחידות עד 100): Place value (40 + 7 = ?).

Missing Addend / Inverse: (9 + [?] = 16).

3. School Reading & Karaoke Storybook Mode (reading.js)

Parent Input Modal: A dedicated screen where parents can paste text sent from school (e.g., stories about animals or space) with Nikud.

Karaoke Word-by-Word Progression:

The text is displayed word by word or sentence by sentence in a large, distraction-free reading card with full Nikud.

Interactive Highlight: The active word being read is highlighted in bright gold/green (karaoke-active).

Tap-to-Advance: The child taps the screen or a "קָרָאתִי (הַמְשֵׁךְ לַמִּלָּה הַבָּאָה) ➔" button to advance word-by-word. Alternatively, she can tap the offline audio button (🔊 הַקְרֵא לִי אֶת הַמִּלָּה) to hear pronunciation.

Reading Checkpoint & Dino Reward:

At the end of each paragraph/story, she triggers a celebratory animation, earns DNA Points, and grants a Small Dino Update (growing a mini-horn, shifting color tint, or hatching a mini-egg component).

Completing the full story unlocks a Legendary Rare Dinosaur in her sanctuary!

4. Modular Animated 2D Dinosaur Rigs (renderer.js)

Treat dinosaurs as hierarchical SVG or Canvas rigs (root, tail, neck-head, wings, legs).

Support 4 distinct body shapes: Theropod (T-Rex), Sauropod (Brachiosaurus), Ceratopsian (Triceratops), and Pterosaur.

5. Expedition / Raid Mode (expedition.js)

A side-scrolling trail where dinosaurs encounter 3 checkpoints with obstacles cleared by matched traits or 2nd-grade puzzles.

6. Dino World, Care & Dress-up (js/world.js, js/wardrobe.js)

A "העולם" tab shows the whole herd living in one scene (wandering, eating, playing, sleeping, splashing, visiting each other; day/night by the device clock). Tapping a dino opens a Tamagotchi-style care panel (feed / play / sleep / wash / hug / rename / dress up). Stats decay slowly with real time but never drop below a floor, so dinos get sad but never die. Care earns at most +1 DNA, and only when the need was real. Dress-up has 6 slots (hat, clothes, glasses, neck, back, tail), items are bought with DNA and shared across dinos. 10 species in total (stego, anky, raptor, para, spino, plesio were added), each with a legendary version and new trail obstacles.

7. Parent Menu (מצב הורים)

Local settings modal where parents can paste weekly school reading texts and custom Hebrew words, saving them directly to localStorage.

8. Class Sharing (online, optional) - PLANNED

Goal: kids in a class can see each other's dinos in a shared "class world" and later gift dinos. Friendly and cooperative only: no rankings, no chat.

Principles
- No personal data beyond a child's first name: no email, phone, surname, picture, ID or number.
- No free-text chat. Interaction is limited to preset emoji and reactions.
- A parent turns the feature on in parent mode (consent switch, with a notice). It is off by default.
- Offline first: if the server is unreachable the game works exactly as it does today.
- The static site stays on GitHub Pages. Only shared data lives on Firebase (free Spark plan): anonymous auth + Firestore.

Identity and classes
- Silent anonymous account on first use; the child never logs in.
- Only the owner creates classes, from admin.html (Google sign-in; admin accounts are listed in the admins collection by hand in the Firebase console). A class has a random join code posted in the parents' group, and can be switched off.
- A child joins with the class code and types a first name (max 12 characters, basic filter).
- A parent can edit the name, leave the class, or delete all online data from parent mode.
- Known limitation: an anonymous account cannot move to a new device. Clearing browser data means rejoining; the owner can remove the stale member.

Moderation (admin.html)
- Create/disable classes, see members, rename or remove any member.
- A rename can lock the name so it cannot be retyped by the child or parent app.
- Delete a member's data entirely.

Data model
- classes/{code}: { name, active, createdAt }
- classes/{code}/members/{uid}: { name, locked, dinos (up to 3 showcased: species, tint, legendary, outfit, name), updatedAt }
- admins/{uid}: marker documents, writable only from the console.

Security rules (firestore.rules)
- A class can be read by its code (get) but never listed. Only members read their class's members. Members write only their own record, cannot change a locked name, and cannot unlock themselves. Only admins create classes or override names.

Phases
1. Cloud identity, parent consent switch, firebase config. [client scaffolding built]
2. Classes, join code, first name, showcase, admin page, rules. [built; needs a Firebase project to run]
3. Class world tab: classmates' showcased dinos visit read-only; they can be fed/played with and given emoji. Refresh every 30-60 seconds. [built: a "הַכִּתָּה" toggle inside the World tab, refresh every 45s, guests react to feeding/playing/hugging but nothing is saved and no DNA is earned; emoji reactions to the server are not built]
4. Gifting: a COPY of a regular dino (not legendary, not the starter T-Rex, not a dino that was itself a gift) sent to a classmate; the sender keeps theirs, so nobody loses a dino. The receiver accepts it from the World tab; deleting the gift document is what claims it, so it can only be accepted once. One pending gift per sender per receiver (the document id is the sender); 1 gift per child per day is enforced in the app only (a hacked client could bypass it). [built]
4b. Emoji reactions: 4 preset reactions (wave, heart, party, star) sent from a visiting dino's panel. One document per sender per receiver, rewriteable at most every 5 seconds (enforced by the rules). The sender's name is never stored in the reaction; the receiver looks it up from the member list. Shown as a bubble over the receiver's dino. [built]
5. WhatsApp picture cards: a dino card (from the care panel) and a progress card (from "הגן שלי"), drawn on a canvas and shared as a PNG through the Web Share API, with a download fallback. Works without the server. [built]
Known limitations: reactions and gifts left behind by a removed or departed member are cleaned up only when the member leaves from the app (an admin removal leaves a few tiny orphan documents); firestore.rules is not run in the emulator (no Java here), so publish it and test with two browsers.

Setup the owner must do: create the Firebase project (Spark plan), enable Anonymous and Google sign-in, create Firestore, add `amit-joyo.github.io` under Authentication > Settings > Authorized domains (needed for the admin Google popup), paste the web app config into js/firebase-config.js (and bump `CACHE` in sw.js so installed copies pick it up), publish firestore.rules, then open admin.html, sign in once and create the document admins/{uid} (the page prints the uid) in the console.

Status: phases 1 and 2 are built (js/cloud.js, js/firebase-config.js, firestore.rules, admin.html, js/admin.js, parent-menu section "שיתוף בכיתה"). Not yet verified against a real Firebase project, and firestore.rules has not been run in the emulator.
