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