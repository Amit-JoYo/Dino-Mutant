/* The walking world, in the style of the Game Boy Pokémon games: a top-down map drawn with pixel tiles.
   She walks outside with the arrow pad (or arrow keys), steps into tall grass to meet creatures, and goes through the doors of the
   Bakery, the House and the Rainbow Shop. Each building is its own small map; its words and creatures match the room.
   A door stays locked until she has caught enough friends. */
(function (global) {
  'use strict';

  const T = 16; // tile size in the small canvas, which is then scaled up with crisp pixels
  const VW = 9;
  const VH = 9;
  const STEP = 170; // ms per tile
  const ENCOUNTER_CHANCE = 0.2;

  const GRASS = 0, TALL = 1, PATH = 2, TREE = 3, WATER = 4, FLOWER = 5, SIGN = 8, ROOF = 9, WALL = 10, DOOR = 11;
  const IWALL = 12, COUNTER = 13, STOVE = 14, SINK = 15, FRIDGE = 16, TABLE = 17, PLANT = 18, BED = 19, SOFA = 20, SHELF = 21, TV = 22, CLOCK = 23, EXIT = 24, CHAIR = 25;
  const UP = 26, DOWN = 27; // stairs to the floor above and the floor below
  const SOLID = new Set([TREE, WATER, SIGN, ROOF, WALL, IWALL, COUNTER, STOVE, SINK, FRIDGE, TABLE, PLANT, BED, SOFA, SHELF, TV, CLOCK, CHAIR]);

  const PAL = {
    forest: { grass: '#6cc46a', g2: '#5db35c', g3: '#86d684', tall: '#3f9a45', tall2: '#2f7f38', tall3: '#59b556', roof: '#7a5a3a' },
    kitchen: { wall: '#cde7ee', wall2: '#a9d0dc', f1: '#f6f0e0', f2: '#ddd3b9', rug: '#e8704a', rug2: '#ffd23f' },
    home: { wall: '#f2d9c4', wall2: '#dcb89a', f1: '#c8925a', f2: '#b07a44', rug: '#5f86e6', rug2: '#bcd0ff', wood: true },
    colours: { wall: '#ffe0f0', wall2: '#f5b5d5', f1: '#fff7d6', f2: '#ffe3a0', rug: '#e2579a', rug2: '#ffd23f', rainbow: true },
    kitchen2: { wall: '#ffe3ee', wall2: '#f5b8cf', f1: '#fff4f8', f2: '#fbd9e6', rug: '#c4668d', rug2: '#ffd1e3' },
    kitchen3: { wall: '#d8e2f2', wall2: '#aebfdc', f1: '#e9edf4', f2: '#cfd6e3', rug: '#4a6fa5', rug2: '#bcd2f5' },
    home2: { wall: '#d9ecff', wall2: '#a9cdf0', f1: '#e6c58d', f2: '#d2ac6e', rug: '#47a86a', rug2: '#bff0cf', wood: true },
    home3: { wall: '#e8dcf7', wall2: '#c4b0e6', f1: '#b98a5e', f2: '#9f734a', rug: '#8a5ac8', rug2: '#dcc8ff', wood: true },
    colours2: { wall: '#e0f6ff', wall2: '#a9defa', f1: '#ffffff', f2: '#e4f4fd', rug: '#2e86de', rug2: '#ffd23f', rainbow: true },
    colours3: { wall: '#3b2f78', wall2: '#2b2250', f1: '#4a3d85', f2: '#3d3270', rug: '#e2579a', rug2: '#ffd23f', rainbow: true },
    hospital: { wall: '#e6f3fb', wall2: '#bcdcee', f1: '#ffffff', f2: '#e8f1f6', rug: '#e5484d', rug2: '#ffffff' },
  };
  const FLOWERS = ['#ff6f91', '#ffd23f', '#ffffff', '#8f6bff', '#4fc3f7'];

  /* The rooms, drawn as text. # wall, . floor, , rug (creatures hide here), = runner, E exit mat, U stairs up, D stairs down,
     C counter, K sink, S stove, F fridge, T table, R chair, P plant, B bed, O sofa, H shelves, V TV, L clock.
     Every building has three floors. The stairs up open when she knows enough words on the floor she is on. */
  const INTERIORS = {
    hospital: {
      zone: 'hospital',
      rows: [
        '############',
        '#CCCC..CCCC#',
        '#..........#',
        '#BB,,==,,BB#',
        '#BB,,==,,BB#',
        '#....==....#',
        '#.RT.==.TR.#',
        '#....==....#',
        '#,,..==..,,#',
        '#P...==...P#',
        '#####EE#####',
      ],
    },
    bakery: {
      zone: 'kitchen',
      up: { to: 'bakery2', need: { zone: 'kitchen', n: 12 } },
      rows: [
        '############',
        '#CKCSCU.CFC#',
        '#..........#',
        '#,,,.==.,,,#',
        '#,,,.==.,,,#',
        '#RTT.==.TTR#',
        '#RTT.==.TTR#',
        '#....==....#',
        '#,,..==..,,#',
        '#P...==...P#',
        '#####EE#####',
      ],
    },
    bakery2: {
      zone: 'kitchen2',
      down: 'bakery',
      up: { to: 'bakery3', need: { zone: 'kitchen2', n: 10 } },
      rows: [
        '############',
        '#CCCCCD..CU#',
        '#..........#',
        '#,,,.==.,,,#',
        '#,,,.==.,,,#',
        '#.TT.==.TT.#',
        '#.TT.==.TT.#',
        '#....==....#',
        '#,,..==..,,#',
        '#P...==...P#',
        '############',
      ],
    },
    bakery3: {
      zone: 'kitchen3',
      down: 'bakery2',
      rows: [
        '############',
        '#SKSCFCSKSD#',
        '#..........#',
        '#,,..TT..,,#',
        '#,,..TT..,,#',
        '#....==....#',
        '#.RT.==.TR.#',
        '#.RT.==.TR.#',
        '#,,..==..,,#',
        '#P...==...P#',
        '############',
      ],
    },
    house: {
      zone: 'home',
      up: { to: 'house2', need: { zone: 'home', n: 12 } },
      rows: [
        '############',
        '#HHHHLVUHH.#',
        '#..........#',
        '#BB,,==,,,.#',
        '#BB,,==,,,.#',
        '#.RT.==....#',
        '#....==.OOO#',
        '#,,..==..,,#',
        '#P...==...P#',
        '#....==....#',
        '#####EE#####',
      ],
    },
    house2: {
      zone: 'home2',
      down: 'house',
      up: { to: 'house3', need: { zone: 'home2', n: 10 } },
      rows: [
        '############',
        '#HHHHVLDHHU#',
        '#..........#',
        '#,,,.==.,,,#',
        '#,,,.==.,,,#',
        '#.TT.==.OOO#',
        '#.TT.==....#',
        '#....==.RR.#',
        '#,,..==..,,#',
        '#P...==...P#',
        '############',
      ],
    },
    house3: {
      zone: 'home3',
      down: 'house2',
      rows: [
        '############',
        '#HHHHLHHHHD#',
        '#..........#',
        '#BB,,==,,BB#',
        '#BB,,==,,BB#',
        '#....==....#',
        '#.TT.==.TT.#',
        '#.RR.==.RR.#',
        '#,,..==..,,#',
        '#P...==...P#',
        '############',
      ],
    },
    shop: {
      zone: 'colours',
      up: { to: 'shop2', need: { zone: 'colours', n: 12 } },
      rows: [
        '############',
        '#HHHHHHUHHH#',
        '#..........#',
        '#,,,.==.,,,#',
        '#,,,.==.,,,#',
        '#.CC.==.CC.#',
        '#....==....#',
        '#,,,.==.,,,#',
        '#P...==...P#',
        '#....==....#',
        '#####EE#####',
      ],
    },
    shop2: {
      zone: 'colours2',
      down: 'shop',
      up: { to: 'shop3', need: { zone: 'colours2', n: 10 } },
      rows: [
        '############',
        '#HHHHHHDHHU#',
        '#..........#',
        '#,,,.==.,,,#',
        '#,,,.==.,,,#',
        '#.CC.==.CC.#',
        '#....==....#',
        '#,,,.==.,,,#',
        '#P...==...P#',
        '#....==....#',
        '############',
      ],
    },
    shop3: {
      zone: 'colours3',
      down: 'shop2',
      rows: [
        '############',
        '#HHHHHHHHHD#',
        '#..........#',
        '#,,,.==.,,,#',
        '#,,,.==.,,,#',
        '#.CC.==.CC.#',
        '#....==....#',
        '#,,,.==.,,,#',
        '#P...==...P#',
        '#....==....#',
        '############',
      ],
    },
  };
  const CHARS = { '#': IWALL, '.': GRASS, ',': TALL, '=': PATH, E: EXIT, C: COUNTER, K: SINK, S: STOVE, F: FRIDGE, T: TABLE, R: CHAIR, P: PLANT, B: BED, O: SOFA, H: SHELF, V: TV, L: CLOCK, U: UP, D: DOWN };
  const ITEM_NAMES = {
    K: ['sink', 'כִּיּוֹר'], S: ['stove', 'תַּנּוּר'], F: ['fridge', 'מְקָרֵר'], C: ['counter', 'שִׁשַּׁת עֲבוֹדָה'], T: ['table', 'שֻׁלְחָן'], R: ['chair', 'כִּסֵּא'],
    P: ['plant', 'צֶמַח'], B: ['bed', 'מִטָּה'], O: ['sofa', 'סְפָּה'], H: ['shelves', 'מַדָּפִים'], V: ['TV', 'טֵלֵוִיזְיָה'], L: ['clock', 'שָׁעוֹן'],
  };

  // the buildings seen from outside: x and y of the top-left corner, which side of the path, the roof colour
  const BUILDINGS = [
    { id: 'bakery', name: 'The Bakery', he: 'הַמַּאֲפִיָּה', x: 2, y: 20, right: false, roof: '#e07a3f' },
    { id: 'house', name: 'My House', he: 'הַבַּיִת שֶׁלִּי', x: 14, y: 12, right: true, roof: '#8a6cd8' },
    { id: 'shop', name: 'The Rainbow Shop', he: 'חֲנוּת הַקֶּשֶׁת', x: 2, y: 5, right: false, roof: '#e2579a' },
    { id: 'hospital', name: 'The Hospital', he: 'בֵּית הַחוֹלִים', x: 16, y: 33, right: true, roof: '#e5484d' },
  ];

  const MAPS = {};
  let cur = null; // the map she is in: { id, w, h, tiles, texts, roofs, doors, zone, inside, back }
  let map = null; // cur.tiles
  let ctx = null;
  let canvas = null;
  let inited = false;
  let active = false;
  let paused = false;
  let raf = 0;
  let last = 0;
  let held = [];
  let steps = 0;
  let lastZone = '';
  let lastBump = 0;
  let msgTimer = 0;
  let bannerTimer = 0;
  const p = { x: 0, y: 0, tx: 0, ty: 0, dir: 'up', moving: false, t: 0, alert: false };
  const buddy = { x: 0, y: 0, tx: 0, ty: 0 };
  const buddyImgs = {};

  const $ = (id) => document.getElementById(id);
  const modalOpen = () => !$('modal').hidden;
  const cxOut = (y) => (y <= 28 ? 9 : 9 + Math.round(3 * Math.sin((y - 28) / 4.2))); // left column of the 2-wide path outside
  const START = () => ({ map: 'outside', x: cxOut(41), y: 41, dir: 'up' });

  function rng(seed) {
    let a = seed;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (x, y, k) => ((Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ Math.imul(k + 1, 83492791)) >>> 0);

  /* ---------- building the maps ---------- */
  function buildOutside() {
    const w = 24;
    const h = 46;
    const r = rng(11);
    const tiles = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x < 2 || x >= w - 2 || y < 2 || y >= h - 2 ? TREE : GRASS)));
    const texts = {};
    const roofs = {};
    const doors = {};
    const reserved = Array.from({ length: h }, () => Array(w).fill(false));
    for (let y = 2; y < h - 2; y++) {
      tiles[y][cxOut(y)] = PATH;
      tiles[y][cxOut(y) + 1] = PATH;
    }

    // tall grass beside the path
    [3, 9, 15, 17, 24, 30, 33, 36, 39].forEach((y0, i) => {
      const wd = 4 + (i % 2);
      const hh = 2 + (i % 2);
      const right = i % 2 === 0;
      for (let y = y0; y < y0 + hh; y++) {
        const xs = right ? cxOut(y) + 2 : cxOut(y) - wd;
        for (let x = xs; x < xs + wd; x++) if (x >= 2 && x <= w - 3 && tiles[y][x] === GRASS) tiles[y][x] = TALL;
      }
    });
    // ponds in the forest
    [[31, 3], [37, 17]].forEach(([y0, px]) => {
      for (let y = y0; y < y0 + 3; y++) for (let x = px; x < px + 4; x++) tiles[y][x] = WATER;
    });

    // the buildings: a roof, a front wall with the door, and a little path from the road to the door
    BUILDINGS.forEach((b) => {
      const yw = b.y + 2;
      const doorX = b.right ? b.x + 1 : b.x + 2;
      for (let y = b.y - 1; y <= yw + 2; y++) for (let x = b.x - 1; x <= b.x + 4; x++) if (y >= 0 && x >= 0 && x < w) reserved[y][x] = true;
      for (let x = b.x; x < b.x + 4; x++) {
        for (let y = b.y; y <= b.y + 1; y++) {
          tiles[y][x] = ROOF;
          roofs[`${x},${y}`] = b.roof;
        }
        tiles[yw][x] = x === doorX ? DOOR : WALL;
      }
      const from = b.right ? cxOut(yw + 1) + 2 : doorX;
      const to = b.right ? doorX : cxOut(yw + 1) - 1;
      for (let x = from; x <= to; x++) {
        tiles[yw + 1][x] = PATH;
        reserved[yw + 1][x] = true;
        reserved[yw + 2][x] = true;
      }
      const sx = b.right ? b.x + 3 : b.x + 1;
      tiles[yw + 1][sx] = SIGN;
      texts[`${sx},${yw + 1}`] = { en: b.name, he: b.he };
      doors[`${doorX},${yw}`] = { to: b.id, name: b.name, he: b.he, zone: INTERIORS[b.id].zone, entry: { x: 5, y: 9 } };
      MAPS[b.id] = MAPS[b.id] || {};
      MAPS[b.id].back = { map: 'outside', x: doorX, y: yw + 1 };
    });

    // signs: where she starts, where the village begins, the end of the road
    const put = (x, y, en, he) => {
      tiles[y][x] = SIGN;
      texts[`${x},${y}`] = { en, he };
    };
    put(cxOut(41) - 1, 41, 'Outside', 'בַּחוּץ');
    put(cxOut(27) - 1, 27, 'The Village', 'הַכְּפָר');
    put(9, 2, 'More adventures soon!', 'עוֹד הַרְפַּתְקָאוֹת בְּקָרוֹב! 🌈');
    put(10, 2, 'More adventures soon!', 'עוֹד הַרְפַּתְקָאוֹת בְּקָרוֹב! 🌈');

    // trees and flowers
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        if (tiles[y][x] !== GRASS || reserved[y][x]) continue;
        const near = Math.abs(x - (cxOut(y) + 0.5)) < 3.2;
        const v = r();
        if (v < (y >= 29 ? 0.15 : 0.07) && !near) tiles[y][x] = TREE;
        else if (v < 0.2) tiles[y][x] = FLOWER;
      }
    }
    return { id: 'outside', w, h, tiles, texts, roofs, doors, zone: 'forest', pal: 'forest', inside: false, stairs: {}, npcs: [] };
  }

  function buildInterior(id, def) {
    const rows = def.rows;
    const h = rows.length;
    const w = rows[0].length;
    const tiles = rows.map((row, y) => {
      if (row.length !== w) throw new Error(`room ${id}: row ${y} has ${row.length} columns, expected ${w}`);
      return [...row].map((c) => (CHARS[c] === undefined ? GRASS : CHARS[c]));
    });
    const texts = {};
    const stairs = {};
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      if (ITEM_NAMES[c]) texts[`${x},${y}`] = { en: ITEM_NAMES[c][0], he: ITEM_NAMES[c][1] };
      if (c === 'U') stairs[`${x},${y}`] = Object.assign({ dir: 'up', x, y }, def.up);
      if (c === 'D') stairs[`${x},${y}`] = { dir: 'down', x, y, to: def.down };
    }));
    return Object.assign(MAPS[id] || {}, { id, w, h, tiles, texts, roofs: {}, doors: {}, zone: def.zone, pal: def.zone, inside: true, stairs, npcs: [] });
  }

  const zoneInfo = (zid) => global.Words.ZONES.find((z) => z.id === zid);
  const doorOpen = (d) => global.Game.caught() >= zoneInfo(d.zone).unlock;
  const doorAt = (x, y) => (cur.doors ? cur.doors[`${x},${y}`] : undefined);
  const stairAt = (x, y) => cur.stairs[`${x},${y}`];
  const stairsLeft = (s) => (s.need ? Math.max(0, s.need.n - global.Game.known(s.need.zone)) : 0);
  const npcAt = (x, y) => cur.npcs.find((n) => n.x === x && n.y === y);

  /* the people who give quests stand on a free floor tile near the spot written in their data */
  function placeNpcs() {
    global.Quests.NPCS.forEach((def) => {
      const m = MAPS[def.map];
      const free = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && (m.tiles[y][x] === GRASS || m.tiles[y][x] === FLOWER)
        && !m.npcs.some((n) => n.x === x && n.y === y);
      let spot = null;
      for (let r = 0; r < 6 && !spot; r++) {
        for (let dy = -r; dy <= r && !spot; dy++) {
          for (let dx = -r; dx <= r && !spot; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && free(def.x + dx, def.y + dy)) spot = { x: def.x + dx, y: def.y + dy };
        }
      }
      if (spot) m.npcs.push({ id: def.id, look: def.look, x: spot.x, y: spot.y, dir: 'down' });
    });
  }

  function solid(x, y) {
    if (x < 0 || y < 0 || x >= cur.w || y >= cur.h) return true;
    const t = map[y][x];
    if (t === DOOR) return !doorOpen(doorAt(x, y));
    if (t === UP) return stairsLeft(stairAt(x, y)) > 0;
    return SOLID.has(t) || !!npcAt(x, y);
  }

  /* ---------- trainers ---------- */
  function placeTrainers() {
    global.Trainers.TRAINERS.forEach((t) => {
      const m = MAPS[t.map];
      if (m.tiles[t.y][t.x] === TREE || m.tiles[t.y][t.x] === FLOWER || m.tiles[t.y][t.x] === TALL) m.tiles[t.y][t.x] = GRASS;
      m.npcs.push({ id: t.id, trainer: true, look: t.look, x: t.x, y: t.y, hx: t.x, hy: t.y, tx: t.x, ty: t.y, dir: t.dir, hd: t.dir, sight: t.sight, mt: 0, armed: true, walking: false, alert: false });
    });
  }

  const homeTrainer = (n) => {
    n.x = n.tx = n.hx;
    n.y = n.ty = n.hy;
    n.dir = n.hd;
    n.mt = 0;
    n.walking = false;
    n.alert = false;
  };

  /* how many tiles away she is along the way the trainer looks, or 0 if the trainer cannot see her */
  function sightOf(n) {
    const [dx, dy] = DIRS[n.dir];
    for (let k = 1; k <= n.sight; k++) {
      const x = n.x + dx * k;
      const y = n.y + dy * k;
      if (x === p.x && y === p.y) return k;
      if (solid(x, y)) return 0;
    }
    return 0;
  }

  function spot(n, k) {
    paused = true;
    held = [];
    n.alert = true;
    n.armed = false;
    global.Sound.sfx.alert();
    setTimeout(() => {
      n.alert = false;
      if (k <= 1) {
        paused = false;
        global.Trainers.challenge(n.id);
        return;
      }
      const [dx, dy] = DIRS[n.dir];
      n.walking = true;
      n.left = k - 1;
      n.mt = 0;
      n.tx = n.x + dx;
      n.ty = n.y + dy;
    }, 800);
  }

  /* a trainer that has seen her walks up to her, one tile at a time, and then asks for the duel */
  function walkTrainers(dt) {
    let any = false;
    cur.npcs.forEach((n) => {
      if (!n.walking) return;
      any = true;
      n.mt += dt / STEP;
      if (n.mt < 1) return;
      n.x = n.tx;
      n.y = n.ty;
      n.mt = 0;
      n.left--;
      if (n.left > 0) {
        const [dx, dy] = DIRS[n.dir];
        n.tx = n.x + dx;
        n.ty = n.y + dy;
      } else {
        n.walking = false;
        paused = false;
        global.Trainers.challenge(n.id);
      }
    });
    return any;
  }

  /** true when a trainer has just spotted her */
  function checkTrainers() {
    for (const n of cur.npcs) {
      if (!n.trainer || n.walking || n.alert) continue;
      const k = sightOf(n);
      if (!n.armed) {
        if (!k) n.armed = !global.Trainers.won(n.id);
        continue;
      }
      if (k) {
        spot(n, k);
        return true;
      }
    }
    return false;
  }

  function setMap(id) {
    cur = MAPS[id];
    map = cur.tiles;
    steps = 0;
  }

  /* ---------- drawing ---------- */
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  }

  function grassBase(pal, mx, my, dx, dy) {
    rect(dx, dy, T, T, pal.grass);
    for (let k = 0; k < 3; k++) {
      const h = hash(mx, my, k);
      rect(dx + (h % 14) + 1, dy + ((h >> 4) % 14) + 1, 1, 1, k % 2 ? pal.g2 : pal.g3);
    }
  }

  function pathBase(mx, my, dx, dy) {
    rect(dx, dy, T, T, '#ead4a3');
    for (let k = 0; k < 4; k++) {
      const h = hash(mx, my, k + 9);
      rect(dx + (h % 14) + 1, dy + ((h >> 4) % 14) + 1, 2, 1, '#dcc28a');
    }
  }

  /* indoor ground: tiles in the kitchen and the shop, wooden boards in the house */
  function floorTile(zid, mx, my, dx, dy) {
    const p = PAL[zid];
    rect(dx, dy, T, T, p.f1);
    if (p.wood) {
      rect(dx, dy + 5, T, 1, p.f2);
      rect(dx, dy + 11, T, 1, p.f2);
      const o = (hash(mx, my >> 1, 3) % 12) + 2;
      rect(dx + o, dy, 1, 5, p.f2);
      rect(dx + ((o + 7) % 12) + 2, dy + 6, 1, 5, p.f2);
    } else {
      rect(dx + 8, dy, 8, 8, p.f2);
      rect(dx, dy + 8, 8, 8, p.f2);
    }
  }

  function runnerTile(dx, dy, left, right) {
    rect(dx, dy, T, T, '#c0392b');
    if (left) rect(dx + 1, dy, 1, T, '#f1c40f');
    if (right) rect(dx + 14, dy, 1, T, '#f1c40f');
    rect(dx + 6, dy + 6, 4, 4, '#e0594a');
    rect(dx + 7, dy + 7, 2, 2, '#f1c40f');
  }

  function rugTile(zid, dx, dy, tick, mx, my) {
    const p = PAL[zid];
    rect(dx, dy, T, T, p.rug);
    rect(dx, dy, T, 1, p.rug2);
    rect(dx, dy + 15, T, 1, p.rug2);
    rect(dx + 2, dy + 2, 12, 12, 'rgba(255,255,255,.14)');
    const s = (tick + mx + my) % 2;
    rect(dx + 7, dy + 3 + s, 2, 10 - s * 2, p.rug2);
    rect(dx + 3, dy + 7, 10, 2, p.rug2);
    rect(dx + 7, dy + 7, 2, 2, '#fff');
  }

  function drawTile(mx, my, dx, dy, tick) {
    const t = map[my][mx];
    const zid = cur.pal;
    const ins = cur.inside;
    const pal = PAL[zid];
    const wallBase = () => {
      rect(dx, dy, T, T, pal.wall);
      rect(dx, dy + 13, T, 3, pal.wall2);
      rect(dx + 7, dy, 1, 13, pal.wall2);
    };
    const floor = () => floorTile(zid, mx, my, dx, dy);
    switch (t) {
      case GRASS:
        if (ins) floor();
        else grassBase(pal, mx, my, dx, dy);
        break;
      case TALL: {
        if (ins) {
          rugTile(zid, dx, dy, tick, mx, my);
          break;
        }
        rect(dx, dy, T, T, pal.tall);
        const sway = (tick + mx + my) % 2;
        [[1, 1], [9, 2], [4, 8], [11, 9]].forEach(([bx, by], i) => {
          const s = (i + sway) % 2;
          rect(dx + bx, dy + by + 1, 1, 3, pal.tall2);
          rect(dx + bx + 1, dy + by + s, 1, 4, pal.tall3);
          rect(dx + bx + 2, dy + by + 1, 1, 3, pal.tall2);
        });
        rect(dx, dy + 14, T, 2, pal.tall2);
        break;
      }
      case PATH:
        if (ins) runnerTile(dx, dy, map[my][mx - 1] !== PATH, map[my][mx + 1] !== PATH);
        else pathBase(mx, my, dx, dy);
        break;
      case EXIT:
        rect(dx, dy, T, T, '#6b4a2a');
        rect(dx + 1, dy + 1, 14, 14, '#d8b98a');
        rect(dx + 4, dy + 4, 8, 8, '#8a5a2a');
        rect(dx + 7, dy + 5, 2, 5, '#ffd23f');
        rect(dx + 5, dy + 8, 6, 1, '#ffd23f');
        break;
      case IWALL:
        wallBase();
        break;
      case COUNTER:
      case STOVE:
      case SINK:
        floor();
        rect(dx, dy, T, T, '#8a5a2a');
        rect(dx, dy, T, 11, '#e6cda0');
        rect(dx, dy + 11, T, 1, '#b08a50');
        if (t === STOVE) {
          rect(dx + 2, dy + 2, 5, 5, '#333');
          rect(dx + 9, dy + 2, 5, 5, '#333');
          rect(dx + 3, dy + 3, 3, 3, '#e5484d');
          rect(dx + 2, dy + 12, 12, 3, '#555');
        } else if (t === SINK) {
          rect(dx + 3, dy + 2, 10, 7, '#bcd9e6');
          rect(dx + 4, dy + 3, 8, 5, '#8dbfd6');
          rect(dx + 7, dy, 2, 3, '#888');
        }
        break;
      case FRIDGE:
        floor();
        rect(dx + 1, dy, 14, T, '#e8eef2');
        rect(dx + 1, dy, 14, 1, '#b8c4cc');
        rect(dx + 1, dy + 6, 14, 1, '#b8c4cc');
        rect(dx + 11, dy + 2, 1, 3, '#888');
        rect(dx + 11, dy + 9, 1, 5, '#888');
        break;
      case TABLE: {
        floor();
        rect(dx, dy, T, T, '#b07a3f');
        rect(dx + 1, dy + 1, 14, 14, '#c58a4a');
        const k = hash(mx, my, 5) % 3;
        if (k === 0) {
          rect(dx + 4, dy + 4, 8, 8, '#fff');
          rect(dx + 6, dy + 6, 4, 4, '#ffd23f');
        } else if (k === 1) {
          rect(dx + 5, dy + 6, 6, 5, '#e5484d');
          rect(dx + 7, dy + 4, 2, 3, '#3f9a45');
        }
        break;
      }
      case CHAIR:
        floor();
        rect(dx + 3, dy + 7, 10, 7, '#c58a4a');
        rect(dx + 3, dy + 2, 10, 4, '#8a5a2a');
        rect(dx + 4, dy + 14, 2, 2, '#6b4a2a');
        rect(dx + 10, dy + 14, 2, 2, '#6b4a2a');
        break;
      case PLANT:
        floor();
        rect(dx + 4, dy + 10, 8, 5, '#b5651d');
        rect(dx + 3, dy + 2, 10, 9, '#3f9a45');
        rect(dx + 5, dy, 6, 4, '#59b556');
        rect(dx + 6, dy + 4, 2, 2, '#2f7f38');
        break;
      case BED:
        floor();
        rect(dx + (mx % 2 ? 0 : 1), dy, 15, T, '#8a5a2a');
        rect(dx + (mx % 2 ? 0 : 2), dy, 13, T, '#e5578a');
        if (map[my - 1][mx] !== BED) {
          rect(dx + (mx % 2 ? 0 : 2), dy, 13, 5, '#fff');
          rect(dx + (mx % 2 ? 0 : 2), dy + 5, 13, 1, '#c93f73');
        } else {
          rect(dx + (mx % 2 ? 0 : 2) + 3, dy + 4, 7, 7, '#ff8fb8');
        }
        break;
      case SOFA:
        floor();
        rect(dx, dy + 2, T, 13, '#6a5acd');
        rect(dx, dy + 1, T, 5, '#4b3fa8');
        rect(dx, dy + 14, T, 1, 'rgba(0,0,0,.25)');
        if (map[my][mx - 1] !== SOFA) rect(dx, dy + 2, 3, 13, '#4b3fa8');
        if (map[my][mx + 1] !== SOFA) rect(dx + 13, dy + 2, 3, 13, '#4b3fa8');
        break;
      case SHELF: {
        rect(dx, dy, T, T, '#7a4e2a');
        const cols = pal.rainbow ? ['#e5484d', '#4da3e8', '#ffd23f', '#3f9a45', '#8f6bff', '#ff9f5a', '#ec6aa6'] : ['#e5484d', '#4da3e8', '#ffd23f', '#3f9a45', '#8f6bff', '#ff9f5a'];
        for (let row = 0; row < 2; row++) {
          let x = 1;
          for (let k = 0; x < 15; k++) {
            const w = 2 + ((hash(mx, my, k + row * 7) >> 2) % 2);
            rect(dx + x, dy + 1 + row * 7, w, 6, cols[hash(mx, my, k + row * 3) % cols.length]);
            x += w + 1;
          }
          rect(dx, dy + 7 + row * 7, T, 1, '#4a3220');
        }
        break;
      }
      case TV:
        wallBase();
        rect(dx + 1, dy + 2, 14, 10, '#222');
        rect(dx + 2, dy + 3, 12, 8, (tick + mx) % 2 ? '#5ec3e8' : '#7fd6f0');
        rect(dx + 5, dy + 12, 6, 2, '#555');
        break;
      case CLOCK:
        wallBase();
        rect(dx + 3, dy + 2, 10, 10, '#8a5a2a');
        rect(dx + 4, dy + 3, 8, 8, '#fff');
        rect(dx + 8, dy + 4, 1, 4, '#222');
        rect(dx + 8, dy + 7, 3, 1, '#222');
        break;
      case UP:
      case DOWN: {
        floor();
        const up = t === UP;
        const locked = up && stairsLeft(stairAt(mx, my)) > 0;
        rect(dx + 1, dy, 14, T, '#6b4a2a');
        for (let i = 0; i < 4; i++) rect(dx + 2, dy + 1 + i * 4, 12, 3, (up ? i : 3 - i) % 2 ? '#d8b98a' : '#c9a773');
        rect(dx + 2, dy + (up ? 13 : 0), 12, 1, 'rgba(0,0,0,.25)');
        // an arrow on the steps, and a padlock while they are shut
        const ay = up ? 4 : 8;
        const ac = locked ? '#9a8f80' : '#ffffff';
        rect(dx + 7, dy + ay + (up ? 2 : 0), 2, 4, ac);
        rect(dx + 5, dy + ay + (up ? 2 : 4), 6, 1, ac);
        rect(dx + 6, dy + ay + (up ? 1 : 5), 4, 1, ac);
        if (locked) {
          rect(dx + 5, dy + 5, 6, 6, '#ffd23f');
          rect(dx + 6, dy + 3, 4, 3, '#b8860b');
          rect(dx + 7, dy + 7, 2, 2, '#7a5a00');
        }
        break;
      }
      case TREE:
        grassBase(pal, mx, my, dx, dy);
        rect(dx + 6, dy + 10, 4, 6, '#7a4e2a');
        rect(dx + 4, dy, 8, 2, pal.tall);
        rect(dx + 2, dy + 2, 12, 3, pal.tall);
        rect(dx + 1, dy + 5, 14, 4, pal.tall);
        rect(dx + 2, dy + 9, 12, 1, pal.tall2);
        rect(dx + 2, dy + 7, 12, 2, pal.tall2);
        rect(dx + 4, dy + 2, 3, 2, pal.tall3);
        rect(dx + 9, dy + 5, 3, 2, pal.tall3);
        break;
      case WATER: {
        rect(dx, dy, T, T, '#4da3e8');
        const o = (tick * 2 + mx) % 6;
        rect(dx + 2 + o, dy + 4, 4, 1, '#9bd0f7');
        rect(dx + 8 - (o % 4), dy + 11, 4, 1, '#9bd0f7');
        break;
      }
      case FLOWER:
        grassBase(pal, mx, my, dx, dy);
        [0, 1].forEach((k) => {
          const h = hash(mx, my, k + 20);
          const c = FLOWERS[h % FLOWERS.length];
          const fx = dx + 2 + ((h >> 3) % 9) + k * 3;
          const fy = dy + 2 + ((h >> 7) % 9);
          rect(fx + 1, fy, 1, 3, c);
          rect(fx, fy + 1, 3, 1, c);
          rect(fx + 1, fy + 1, 1, 1, '#ffd23f');
        });
        break;
      case SIGN:
        if (ins) floor();
        else grassBase(pal, mx, my, dx, dy);
        rect(dx + 7, dy + 8, 2, 7, '#8a5a2a');
        rect(dx + 2, dy + 2, 12, 7, '#e9c37f');
        rect(dx + 2, dy + 2, 12, 1, '#a8703a');
        rect(dx + 2, dy + 8, 12, 1, '#a8703a');
        rect(dx + 4, dy + 4, 8, 1, '#7a5a3a');
        rect(dx + 4, dy + 6, 6, 1, '#7a5a3a');
        break;
      case ROOF:
        rect(dx, dy, T, T, cur.roofs[`${mx},${my}`] || pal.roof);
        rect(dx, dy + 4, T, 1, 'rgba(0,0,0,.18)');
        rect(dx, dy + 9, T, 1, 'rgba(0,0,0,.18)');
        rect(dx, dy + 13, T, 3, 'rgba(0,0,0,.3)');
        break;
      case WALL:
        rect(dx, dy, T, T, '#f3e3c3');
        rect(dx + 4, dy + 3, 8, 7, '#8a5a2a');
        rect(dx + 5, dy + 4, 6, 5, '#8fd0f5');
        rect(dx + 7, dy + 4, 1, 5, '#8a5a2a');
        rect(dx, dy + 14, T, 2, '#9a8f80');
        break;
      case DOOR: {
        const open = doorOpen(doorAt(mx, my));
        rect(dx, dy, T, T, '#f3e3c3');
        rect(dx, dy + 14, T, 2, '#9a8f80');
        rect(dx + 3, dy + 1, 10, 15, '#6b4a2a');
        rect(dx + 4, dy + 2, 8, 14, open ? '#c98d4d' : '#8a6a4a');
        rect(dx + 10, dy + 9, 1, 2, '#ffd23f');
        if (!open) {
          rect(dx + 5, dy + 5, 6, 6, '#ffd23f');
          rect(dx + 6, dy + 3, 4, 3, '#b8860b');
          rect(dx + 7, dy + 7, 2, 2, '#7a5a00');
        }
        break;
      }
      default:
        break;
    }
  }

  const PLAYER_LOOK = { skin: '#f5c9a0', hair: '#5a3a22', shirt: '#ff6fa5', pants: '#3f6fd8' };

  function drawPlayer(dx, dy, dir, frame, look = PLAYER_LOOK) {
    const { skin, hair, shirt, pants, hat } = look;
    const leg = frame === 1 ? 2 : 3;
    const leg2 = frame === 2 ? 2 : 3;
    rect(dx + 4, dy + 15, 8, 1, 'rgba(0,0,0,.18)');
    if (dir === 'left' || dir === 'right') {
      const m = (x, w) => (dir === 'right' ? dx + x : dx + 16 - x - w);
      rect(m(5, 6), dy + 1, 6, 4, hair);
      rect(m(5, 6), dy + 4, 6, 5, skin);
      rect(m(dir === 'right' ? 9 : 5, 1), dy + 6, 1, 2, '#222');
      rect(m(4, 3), dy + 3, 3, 5, hair);
      rect(m(5, 6), dy + 9, 6, 4, shirt);
      rect(m(6, 3), dy + 10, 2, 3, skin);
      rect(m(6, 2), dy + 13, 2, leg, pants);
      rect(m(8, 2), dy + 13, 2, leg2, pants);
      rect(m(5, 3), dy + 13 + leg - 1, 4, 1, '#fff');
      if (hat) rect(m(4, 8), dy - 2, 8, 4, hat);
      return;
    }
    rect(dx + 4, dy + 1, 8, 4, hair);
    rect(dx + 3, dy + 3, 1, 5, hair);
    rect(dx + 12, dy + 3, 1, 5, hair);
    if (dir === 'down') {
      rect(dx + 4, dy + 4, 8, 5, skin);
      rect(dx + 6, dy + 6, 1, 2, '#222');
      rect(dx + 9, dy + 6, 1, 2, '#222');
    } else {
      rect(dx + 4, dy + 4, 8, 5, hair);
    }
    rect(dx + 4, dy + 9, 8, 4, shirt);
    rect(dx + 3, dy + 10, 1, 3, skin);
    rect(dx + 12, dy + 10, 1, 3, skin);
    rect(dx + 5, dy + 13, 2, leg, pants);
    rect(dx + 9, dy + 13, 2, leg2, pants);
    rect(dx + 5, dy + 12 + leg, 2, 1, '#fff');
    rect(dx + 9, dy + 12 + leg2, 2, 1, '#fff');
    if (hat) rect(dx + 3, dy - 2, 10, 4, hat);
  }

  /* the "!" over a person who has a quest to give and the "?" over one waiting for her to finish it */
  function drawMarker(dx, dy, kind) {
    const rows = kind === '!' ? ['11', '11', '11', '11', '00', '11'] : ['0110', '1001', '0010', '0100', '0000', '0100'];
    const c = kind === '!' ? '#ffd23f' : '#5ee08a';
    const bob = Math.round(Math.sin(performance.now() / 220));
    const w = rows[0].length;
    rows.forEach((row, y) => [...row].forEach((v, x) => {
      if (v === '1') {
        rect(dx + 8 - w + x * 2, dy - 15 + y * 2 + bob, 2, 2, c);
      }
    }));
  }

  function buddyImage(id, stage) {
    const key = `${id}:${stage}`;
    if (!buddyImgs[key]) {
      const img = new Image();
      const svg = global.Creatures.draw(id, { stage }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      buddyImgs[key] = img;
    }
    return buddyImgs[key];
  }

  function render(now) {
    const tick = Math.floor(now / 400);
    const t = p.moving ? Math.min(1, p.t / STEP) : 0;
    const fx = p.x + (p.tx - p.x) * t;
    const fy = p.y + (p.ty - p.y) * t;
    const camX = Math.min(Math.max(fx - (VW - 1) / 2, 0), cur.w - VW);
    const camY = Math.min(Math.max(fy - (VH - 1) / 2, 0), cur.h - VH);
    const ox = Math.round(camX * T);
    const oy = Math.round(camY * T);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW * T, VH * T);
    const x0 = Math.floor(camX);
    const y0 = Math.floor(camY);
    for (let my = y0; my <= Math.min(cur.h - 1, y0 + VH); my++) {
      for (let mx = x0; mx <= Math.min(cur.w - 1, x0 + VW); mx++) drawTile(mx, my, mx * T - ox, my * T - oy, tick);
    }
    cur.npcs.forEach((n) => {
      const mt = n.walking ? n.mt : 0;
      const nx = Math.round((n.x + (n.tx - n.x) * mt) * T - ox);
      const ny = Math.round((n.y + (n.ty - n.y) * mt) * T - oy);
      if (nx < -T || ny < -T * 2 || nx > VW * T || ny > VH * T + T) return;
      drawPlayer(nx, ny, n.dir, n.walking ? (mt < 0.5 ? 1 : 2) : 0, n.look);
      const mk = n.alert ? '!' : n.trainer ? '' : global.Quests.marker(n.id);
      if (mk) drawMarker(nx, ny, mk);
    });
    const b = global.Game.buddy();
    if (b) {
      const bt = buddy.x === buddy.tx && buddy.y === buddy.ty ? 0 : t;
      const bx = buddy.x + (buddy.tx - buddy.x) * bt;
      const by = buddy.y + (buddy.ty - buddy.y) * bt;
      const img = buddyImage(b.id, b.stage);
      const bob = b.fainted ? 0 : Math.round(Math.sin(now / 180) * 0.8);
      if (img.complete && img.naturalWidth) {
        ctx.imageSmoothingEnabled = true;
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.fillRect(Math.round(bx * T - ox) + 3, Math.round(by * T - oy) + 14, 10, 1);
        if (b.fainted) ctx.globalAlpha = 0.4;
        ctx.drawImage(img, Math.round(bx * T - ox) + 1, Math.round(by * T - oy) + 1 + bob, 14, 14);
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = false;
        if (b.fainted) {
          const zx = Math.round(bx * T - ox) + 10;
          const zy = Math.round(by * T - oy) + 1 - (Math.floor(now / 500) % 2);
          rect(zx, zy, 3, 1, '#fff');
          rect(zx + 2, zy + 1, 1, 1, '#fff');
          rect(zx, zy + 2, 3, 1, '#fff');
        }
      }
    }
    const sx = Math.round(fx * T - ox);
    const sy = Math.round(fy * T - oy);
    drawPlayer(sx, sy, p.dir, p.moving ? (t < 0.5 ? 1 : 2) : 0);
    if (p.alert) {
      rect(sx + 6, sy - 9, 4, 6, '#e5484d');
      rect(sx + 6, sy - 2, 4, 2, '#e5484d');
      rect(sx + 5, sy - 10, 6, 1, '#fff');
    }
  }

  /* ---------- moving ---------- */
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function message(en, he, speak) {
    const el = $('world-msg');
    el.innerHTML = `${en ? `<b dir="ltr">${en}</b>` : ''}<span>${he}</span>`;
    el.hidden = false;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => (el.hidden = true), 4200);
    if (speak) global.Sound.sayAll([{ text: en, lang: 'en' }, { text: he, lang: 'he' }]);
    else if (speak === undefined) global.Sound.sayAll([{ text: he, lang: 'he' }]);
  }

  function banner() {
    const z = zoneInfo(cur.zone);
    const el = $('world-banner');
    el.innerHTML = `<b dir="ltr">${z.emoji} ${z.name}</b><span>${z.he} · ${global.Game.known(cur.zone)}/${z.words.length} ⭐</span>`;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => (el.hidden = true), 2600);
  }

  function savePos() {
    global.Game.state().pos = { map: cur.id, x: p.x, y: p.y, dir: p.dir };
    global.Game.save();
  }

  function place(pos) {
    p.x = p.tx = pos.x;
    p.y = p.ty = pos.y;
    p.dir = pos.dir || 'up';
    p.moving = false;
    const [dx, dy] = DIRS[p.dir];
    buddy.x = buddy.tx = pos.x - dx;
    buddy.y = buddy.ty = pos.y - dy;
    if (solid(buddy.tx, buddy.ty)) {
      buddy.x = buddy.tx = pos.x;
      buddy.y = buddy.ty = pos.y;
    }
  }

  /* through a door or up the stairs: fade to black, swap the map, fade back */
  function warp(mapId, x, y, dir) {
    paused = true;
    held = [];
    p.moving = false;
    const wrap = $('world-wrap');
    wrap.classList.add('fade');
    global.Sound.sfx.tap();
    setTimeout(() => {
      setMap(mapId);
      place({ x, y, dir });
      lastZone = cur.zone;
      savePos();
      banner();
      if (cur.inside) global.Sound.sayAll([{ text: zoneInfo(cur.zone).name, lang: 'en' }, { text: zoneInfo(cur.zone).he, lang: 'he' }]);
    }, 230);
    setTimeout(() => {
      wrap.classList.remove('fade');
      paused = false;
      checkTrainers();
    }, 500);
  }

  function trigger(zid) {
    paused = true;
    p.alert = true;
    held = [];
    global.Sound.sfx.alert();
    $('world-wrap').classList.add('flash');
    setTimeout(() => {
      $('world-wrap').classList.remove('flash');
      p.alert = false;
      global.Game.startEncounter(zid);
    }, 850);
  }

  function arrive() {
    p.x = p.tx;
    p.y = p.ty;
    p.moving = false;
    const tile = map[p.y][p.x];
    if (tile === DOOR) {
      const d = doorAt(p.x, p.y);
      warp(d.to, d.entry.x, d.entry.y, 'up');
      return;
    }
    if (tile === EXIT) {
      const back = cur.back;
      warp(back.map, back.x, back.y, 'down');
      return;
    }
    if (tile === UP || tile === DOWN) {
      // she comes out next to the stairs on the other floor, facing away from them
      const s = stairAt(p.x, p.y);
      const other = Object.values(MAPS[s.to].stairs).find((o) => o.dir !== s.dir);
      warp(s.to, other.x, other.y + 1, 'down');
      return;
    }
    savePos();
    if (checkTrainers()) return;
    if (tile === TALL) {
      steps++;
      if (steps >= 3 && Math.random() < ENCOUNTER_CHANCE) {
        steps = 0;
        trigger(cur.zone);
      }
    }
  }

  function tryMove() {
    const d = held[held.length - 1];
    if (!d) return;
    p.dir = d;
    const [dx, dy] = DIRS[d];
    const nx = p.x + dx;
    const ny = p.y + dy;
    if (solid(nx, ny)) {
      const now = performance.now();
      if (now - lastBump > 1400) {
        lastBump = now;
        global.Sound.sfx.bump();
        const door = nx >= 0 && ny >= 0 && nx < cur.w && ny < cur.h && map[ny][nx] === DOOR ? doorAt(nx, ny) : null;
        const stair = nx >= 0 && ny >= 0 && nx < cur.w && ny < cur.h && map[ny][nx] === UP ? stairAt(nx, ny) : null;
        if (door) {
          const left = zoneInfo(door.zone).unlock - global.Game.caught();
          message(door.name, `🔒 הַדֶּלֶת נְעוּלָה. צָרִיךְ לִתְפֹּס עוֹד ${left} ${left === 1 ? 'יְצוּר' : 'יְצוּרִים'} כְּדֵי לִפְתֹּחַ אוֹתָהּ`, true);
        } else if (stair && stairsLeft(stair) > 0) {
          const left = stairsLeft(stair);
          message('Learn more words to go up!', `🔒 הַמַּדְרֵגוֹת נְעוּלוֹת. צָרִיךְ לָדַעַת עוֹד ${left} ${left === 1 ? 'מִלָּה' : 'מִלִּים'} בַּקּוֹמָה הַזּוֹ כְּדֵי לַעֲלוֹת 🪜`, true);
        }
      }
      return;
    }
    buddy.x = buddy.tx;
    buddy.y = buddy.ty;
    buddy.tx = p.x;
    buddy.ty = p.y;
    p.tx = nx;
    p.ty = ny;
    p.moving = true;
    p.t = 0;
  }

  function update(dt) {
    if (walkTrainers(dt)) return;
    if (paused) return;
    if (modalOpen()) {
      held = [];
      if (!p.moving) return;
    }
    if (p.moving) {
      p.t += dt;
      if (p.t >= STEP) {
        const extra = p.t - STEP;
        arrive();
        buddy.x = buddy.tx;
        buddy.y = buddy.ty;
        if (!paused) {
          tryMove();
          if (p.moving) p.t = extra;
        }
      }
      return;
    }
    tryMove();
  }

  function frame(now) {
    if (!active) return;
    const dt = Math.min(60, last ? now - last : 16);
    last = now;
    update(dt);
    render(now);
    raf = requestAnimationFrame(frame);
  }

  function interact() {
    if (paused || p.moving || modalOpen()) return;
    const [dx, dy] = DIRS[p.dir];
    const x = p.x + dx;
    const y = p.y + dy;
    const npc = npcAt(x, y);
    if (npc) {
      npc.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
      held = [];
      if (npc.trainer) {
        global.Trainers.talk(npc.id);
        npc.dir = npc.hd;
      } else global.Quests.talk(npc.id);
      return;
    }
    const t = cur.texts[`${x},${y}`];
    if (t) {
      message(t.en, t.he, true);
      global.Quests.event('read', { en: t.en });
      return;
    }
    const d = doorAt(x, y);
    if (d) message(d.name, d.he, true);
  }

  /* ---------- input ---------- */
  const press = (d) => {
    held = held.filter((x) => x !== d);
    held.push(d);
  };
  const release = (d) => {
    held = held.filter((x) => x !== d);
  };

  function bindInput() {
    document.querySelectorAll('#dpad [data-dir]').forEach((b) => {
      const d = b.dataset.dir;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* still works without capture */ }
        press(d);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => release(d)));
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    $('btn-act').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      interact();
    });
    $('world-msg').addEventListener('click', () => ($('world-msg').hidden = true));
    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    document.addEventListener('keydown', (e) => {
      if (!active || modalOpen()) return;
      if (KEYS[e.key]) {
        e.preventDefault();
        if (!e.repeat) press(KEYS[e.key]);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!e.repeat) interact();
      }
    });
    document.addEventListener('keyup', (e) => {
      if (KEYS[e.key]) release(KEYS[e.key]);
    });
    window.addEventListener('blur', () => (held = []));
  }

  function init() {
    MAPS.outside = buildOutside();
    Object.keys(INTERIORS).forEach((id) => {
      MAPS[id] = buildInterior(id, INTERIORS[id]);
    });
    placeNpcs();
    placeTrainers();
    canvas = $('world-canvas');
    canvas.width = VW * T;
    canvas.height = VH * T;
    ctx = canvas.getContext('2d');
    bindInput();
    const saved = global.Game.state().pos;
    const pos = saved && saved.map && MAPS[saved.map] ? saved : START();
    setMap(pos.map);
    place(solid(pos.x, pos.y) ? START() : pos);
    if (solid(p.x, p.y)) {
      setMap('outside');
      place(START());
    }
    inited = true;
  }

  function enter() {
    if (!inited) init();
    active = true;
    paused = false;
    held = [];
    last = 0;
    p.alert = false;
    $('world-wrap').classList.remove('flash', 'fade');
    const st = global.Game.state();
    if (!st.seenIntro) {
      st.seenIntro = true;
      global.Game.save();
      message('', '🕹️ הַחִצִּים מַזִּיזִים אוֹתָךְ. בָּעֵשֶׂב וּבַשְּׁטִיחִים מְחַכִּים יְצוּרִים! 🌾 אֶפְשָׁר לִכָּנֵס לַבָּתִּים דֶּרֶךְ הַדְּלָתוֹת 🚪');
    }
    lastZone = cur.zone;
    banner();
    // trainers go back to their spots; one she is standing in front of waits until she has stepped away
    Object.values(MAPS).forEach((m) => m.npcs.forEach((n) => n.trainer && homeTrainer(n)));
    cur.npcs.forEach((n) => {
      if (n.trainer) n.armed = !global.Trainers.won(n.id) && sightOf(n) === 0;
    });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function leave() {
    active = false;
    held = [];
    cancelAnimationFrame(raf);
  }

  function reset() {
    if (!inited) return;
    const s = START();
    setMap(s.map);
    place(s);
  }

  /* she said "not now": the trainer goes back and waits until she has walked out of sight */
  function sendTrainerHome(id) {
    Object.values(MAPS).forEach((m) => m.npcs.forEach((n) => {
      if (n.id === id && n.trainer) {
        homeTrainer(n);
        n.armed = false;
      }
    }));
    paused = false;
  }

  global.World = { enter, leave, reset, release: sendTrainerHome };
})(window);
