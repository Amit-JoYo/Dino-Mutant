/* Dino Town: the big map around the meadow (roads, building lots, decorations) and the town save data. */
(function (global) {
  'use strict';

  // Map units: 1 unit = 1% of the World frame's width. The original meadow is the top-left 100 x 100.
  const MAP = { w: 400, h: 300 };
  const MEADOW = { x1: 100, y1: 102 };
  const START_LOTS = 6;

  const ROADS = [
    { x0: 0, x1: 400, y0: 104, y1: 112 },
    { x0: 0, x1: 400, y0: 200, y1: 208 },
    { x0: 0, x1: 400, y0: 288, y1: 296 },
    { x0: 102, x1: 110, y0: 104, y1: 296, v: true },
    { x0: 252, x1: 260, y0: 104, y1: 296, v: true },
  ];

  const LOT_W = 38;
  const LOT_H = 34;
  // Lots stand on the top edge of a road. Opened in order of distance from the meadow.
  const LOTS = [
    ...[134, 182, 230, 278, 326, 374].map((x) => ({ x, y: 104 })),
    ...[26, 74, 134, 182, 230, 284, 330, 376].map((x) => ({ x, y: 200 })),
    ...[26, 74, 134, 182, 230, 284, 330, 376].map((x) => ({ x, y: 288 })),
  ]
    .sort((a, b) => Math.hypot(a.x - 50, a.y - 104) - Math.hypot(b.x - 50, b.y - 104))
    .map((l, i) => Object.assign(l, { id: i }));

  // Fixed pseudo-random scatter so the town looks the same every visit.
  function seeded(seed) {
    let t = seed;
    return () => {
      t = (t * 1664525 + 1013904223) % 4294967296;
      return t / 4294967296;
    };
  }

  const onRoad = (x, y, pad) => ROADS.some((r) => x > r.x0 - pad && x < r.x1 + pad && y > r.y0 - pad && y < r.y1 + pad + 4);
  const onLot = (x, y) => LOTS.some((l) => Math.abs(x - l.x) < LOT_W / 2 + 4 && y > l.y - LOT_H - 6 && y < l.y + 2);

  const DECOR = (() => {
    const out = [
      { e: '🏔️', x: 210, y: 50, k: 22, far: true },
      { e: '⛰️', x: 320, y: 50, k: 16, far: true },
      { e: '🏔️', x: 385, y: 50, k: 14, far: true },
      { e: '🎈', x: 290, y: 24, k: 6, far: true, float: true },
      { e: '🌳', x: 104, y: 66, k: 12 },
      { e: '🌷', x: 112, y: 92, k: 5 },
    ];
    const rnd = seeded(7);
    const kinds = [['🌳', 12], ['🌲', 11], ['🌳', 13], ['🌷', 5], ['🌼', 5], ['🌻', 6], ['🪨', 5], ['🍄', 4.5], ['🌿', 6], ['🌸', 5]];
    [[118, 162], [214, 250]].forEach(([y0, y1]) => {
      let n = 0;
      for (let tries = 0; n < 22 && tries < 400; tries++) {
        const x = 6 + rnd() * 388;
        const y = y0 + rnd() * (y1 - y0);
        if (onRoad(x, y, 3) || onLot(x, y) || out.some((o) => Math.hypot(o.x - x, o.y - y) < 14)) continue;
        const [e, k] = kinds[Math.floor(rnd() * kinds.length)];
        out.push({ e, x, y, k });
        n++;
      }
    });
    // Street trees between neighbouring lots.
    LOTS.forEach((l) => {
      const x = l.x + 24;
      if (x < 396 && !onRoad(x, l.y - 2, 1) && LOTS.some((o) => o.y === l.y && Math.abs(o.x - (l.x + 48)) < 4)) out.push({ e: '🌳', x, y: l.y - 1, k: 9 });
    });
    return out;
  })();

  const Town = {
    MAP,
    MEADOW,
    LOTS,

    migrate(s) {
      const t = s.town && typeof s.town === 'object' ? s.town : {};
      s.town = {
        v: 1,
        stars: Number(t.stars) || 0,
        lots: Math.max(START_LOTS, Number(t.lots) || 0),
        buildings: Array.isArray(t.buildings) ? t.buildings : [],
      };
    },

    state() {
      return global.App.state.town;
    },

    inMeadow(x, y) {
      return x <= MEADOW.x1 && y <= MEADOW.y1;
    },

    /* A spot on the grass just below a street, where strolling dinos go to look around town. */
    strollPoint() {
      for (let i = 0; i < 30; i++) {
        const r = ROADS[Math.random() < 0.55 ? 0 : 1];
        const x = 8 + Math.random() * 384;
        const y = r.y1 + 6 + Math.random() * 26;
        if (!onRoad(x, y, 2) && !onLot(x, y)) return { x, y };
      }
      return { x: 150, y: 125 };
    },

    clampToMap(p) {
      p.x = Math.max(6, Math.min(MAP.w - 6, p.x));
      p.y = Math.max(56, Math.min(MAP.h - 6, p.y));
      return p;
    },

    mapHtml() {
      const open = Town.state().lots;
      const roads = ROADS.map((r) =>
        `<div class="w-road${r.v ? ' v' : ''}" style="left:calc(var(--u)*${r.x0});top:calc(var(--u)*${r.y0});width:calc(var(--u)*${r.x1 - r.x0});height:calc(var(--u)*${r.y1 - r.y0})"></div>`
      ).join('');
      const lots = LOTS.map((l) => {
        const locked = l.id >= open;
        return `<button class="w-lot${locked ? ' locked' : ''}" data-lot="${l.id}" style="left:calc(var(--u)*${l.x - LOT_W / 2});top:calc(var(--u)*${l.y - LOT_H - 1});width:calc(var(--u)*${LOT_W});height:calc(var(--u)*${LOT_H});z-index:${Math.round(l.y * 10) - 5}" aria-label="${locked ? 'מִגְרָשׁ נָעוּל' : 'מִגְרָשׁ לִבְנִיָּה'}">${locked ? '<span>🔒</span>' : '<span>🏗️</span><b>+</b>'}</button>`;
      }).join('');
      const decor = DECOR.map((p) =>
        `<span class="w-prop-item${p.far ? ' far' : ''}${p.float ? ' floaty' : ''}" style="left:calc(var(--u)*${p.x});top:calc(var(--u)*${p.y});font-size:calc(var(--u)*${p.k});z-index:${p.far ? 0 : Math.round(p.y * 10)}">${p.e}</span>`
      ).join('');
      return { roads, lots, decor };
    },

    miniHtml() {
      const pct = (v, of) => `${(v / of) * 100}%`;
      const roads = ROADS.map((r) => `<i class="mm-road" style="left:${pct(r.x0, MAP.w)};top:${pct(r.y0, MAP.h)};width:${pct(r.x1 - r.x0, MAP.w)};height:${pct(r.y1 - r.y0, MAP.h)}"></i>`).join('');
      const open = Town.state().lots;
      const lots = LOTS.map((l) => `<i class="mm-lot${l.id >= open ? ' locked' : ''}" style="left:${pct(l.x - LOT_W / 2, MAP.w)};top:${pct(l.y - LOT_H, MAP.h)};width:${pct(LOT_W, MAP.w)};height:${pct(LOT_H, MAP.h)}"></i>`).join('');
      return `<i class="mm-sky"></i><i class="mm-pond"></i>${roads}${lots}<div class="mm-dots" id="mm-dots"></div><i class="mm-view" id="mm-view"></i>`;
    },

    onLot(id) {
      const App = global.App;
      if (id >= Town.state().lots) return App.toast('🔒 הַמִּגְרָשׁ הַזֶּה יִפָּתַח בְּהֶמְשֵׁךְ');
      App.toast('🏗️ בְּקָרוֹב תּוּכְלִי לִבְנוֹת כָּאן!');
    },
  };

  global.Town = Town;
})(window);
