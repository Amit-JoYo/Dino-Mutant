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
  const BLD_W = 40;
  const BLD_H = 48;
  const TD = () => global.TownData;
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
        buildings: Array.isArray(t.buildings)
          ? t.buildings.filter((b, i, all) => b && global.TownData.BY_ID[b.type] && LOTS[b.lot] && all.findIndex((o) => o && o.lot === b.lot) === i)
          : [],
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

    mapHtml(fresh) {
      const t = Town.state();
      const open = t.lots;
      const roads = ROADS.map((r) =>
        `<div class="w-road${r.v ? ' v' : ''}" style="left:calc(var(--u)*${r.x0});top:calc(var(--u)*${r.y0});width:calc(var(--u)*${r.x1 - r.x0});height:calc(var(--u)*${r.y1 - r.y0})"></div>`
      ).join('');
      const lots = LOTS.map((l) => {
        const z = Math.round(l.y * 10) - 5;
        const b = Town.buildingAt(l.id);
        if (b) {
          const info = TD().BY_ID[b.type];
          const rising = fresh === l.id;
          return `<button class="w-bld${rising ? ' rising' : ''}" data-lot="${l.id}" style="left:calc(var(--u)*${l.x - BLD_W / 2});top:calc(var(--u)*${l.y + 1 - BLD_H});width:calc(var(--u)*${BLD_W});height:calc(var(--u)*${BLD_H});z-index:${z}" aria-label="${info.name}">${TD().svg(b.type)}${rising ? '<span class="bld-crane">🏗️</span><span class="bld-dust d1">💨</span><span class="bld-dust d2">💨</span>' : ''}</button>`;
        }
        const locked = l.id >= open;
        return `<button class="w-lot${locked ? ' locked' : ''}" data-lot="${l.id}" style="left:calc(var(--u)*${l.x - LOT_W / 2});top:calc(var(--u)*${l.y - LOT_H - 1});width:calc(var(--u)*${LOT_W});height:calc(var(--u)*${LOT_H});z-index:${z}" aria-label="${locked ? 'מִגְרָשׁ נָעוּל' : 'מִגְרָשׁ לִבְנִיָּה'}">${locked ? '<span>🔒</span>' : '<span>🏗️</span><b>+</b>'}</button>`;
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
      const lots = LOTS.map((l) => {
        const b = Town.buildingAt(l.id);
        const look = b && TD().BY_ID[b.type].look;
        const color = look ? `;background:${look.wall || (look.shape === 'pool' ? '#5ec8f2' : '#a5e08a')}` : '';
        return `<i class="mm-lot${b ? ' built' : l.id >= open ? ' locked' : ''}" style="left:${pct(l.x - LOT_W / 2, MAP.w)};top:${pct(l.y - LOT_H, MAP.h)};width:${pct(LOT_W, MAP.w)};height:${pct(LOT_H, MAP.h)}${color}"></i>`;
      }).join('');
      return `<i class="mm-sky"></i><i class="mm-pond"></i>${roads}${lots}<div class="mm-dots" id="mm-dots"></div><i class="mm-view" id="mm-view"></i>`;
    },

    buildingAt(lotId) {
      return Town.state().buildings.find((b) => b.lot === lotId) || null;
    },

    onLot(id) {
      const App = global.App;
      if (Town.buildingAt(id)) return openBuilding(id);
      if (id >= Town.state().lots) return App.toast('🔒 הַמִּגְרָשׁ הַזֶּה יִפָּתַח בְּהֶמְשֵׁךְ');
      openCatalog(id);
    },
  };

  /* ------------------------------------------------------------------ building flow */
  const esc = (s) => global.Puzzles.escapeHtml(s);
  const noEmoji = (s) => String(s).replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').trim();
  const needMore = (n) => global.App.toast(`צָרִיךְ עוֹד ${n} דנ״א. קִרְאִי סִפּוּר אוֹ פִּתְרִי חִידוֹת! 📖🧩`);
  let pz = null;

  function modal(html, onClick) {
    const App = global.App;
    if (global.document.getElementById('modal').hidden) {
      App.openModal('', () => {
        global.document.getElementById('modal-card').onclick = null;
        if (pz) pz.destroy();
        pz = null;
      });
    }
    const card = global.document.getElementById('modal-card');
    card.innerHTML = html;
    card.onclick = onClick;
  }

  function openCatalog(lotId) {
    const App = global.App;
    const t = Town.state();
    const cards = TD().BUILDINGS.map((b) => {
      const have = t.buildings.filter((x) => x.type === b.id).length;
      return `<button class="tc-card${App.state.dna < b.cost ? ' poor' : ''}" data-b="${b.id}">${TD().svg(b.id)}<b>${b.name}</b><em>🧬 ${b.cost}</em>${have ? `<i class="tc-have">✔${have > 1 ? ` ${have}` : ''}</i>` : ''}</button>`;
    }).join('');
    modal(`
      <h2>🏗️ מָה נִבְנֶה כָּאן?</h2>
      <div class="tc-dna">🧬 <b>${App.state.dna}</b></div>
      <div class="tc-grid">${cards}</div>
      <div class="row"><button class="btn ghost" data-close>בִּטּוּל</button></div>`, (e) => {
      const c = e.target.closest('[data-b]');
      if (c) openDetail(lotId, c.dataset.b);
    });
  }

  function openDetail(lotId, type) {
    const App = global.App;
    const b = TD().BY_ID[type];
    modal(`
      <h2>${b.look.sign} ${b.name}</h2>
      <div class="tc-big">${TD().svg(type)}</div>
      <p class="tc-desc">${b.desc}</p>
      <div class="row"><button class="btn small" data-say>🔊 הַקְרֵא לִי</button></div>
      <div class="row">
        <button class="btn big gold" data-go>לִבְנוֹת! 🧬 ${b.cost}</button>
        <button class="btn ghost" data-back>➔ חֲזָרָה</button>
      </div>`, (e) => {
      if (e.target.closest('[data-say]')) return App.speak(`${noEmoji(b.name)}. ${noEmoji(b.desc)}`);
      if (e.target.closest('[data-back]')) return openCatalog(lotId);
      if (!e.target.closest('[data-go]')) return;
      if (App.state.dna < b.cost) return needMore(b.cost - App.state.dna);
      openQuestion(lotId, type);
    });
  }

  /* One builder's question before the building goes up. Wrong answers just retry, with a hint. */
  function openQuestion(lotId, type) {
    modal(`
      <h2>👷 עִזְרִי לַבַּנַּאי לִבְנוֹת!</h2>
      <div id="tc-pz"></div>
      <div class="row"><button class="btn ghost small" data-back>➔ חֲזָרָה</button></div>`, (e) => {
      if (e.target.closest('[data-back]')) {
        if (pz) pz.destroy();
        pz = null;
        openDetail(lotId, type);
      }
    });
    pz = global.Puzzles.mount(global.document.getElementById('tc-pz'), {
      kind: 'build',
      onSolved: () => setTimeout(() => finishBuild(lotId, type), 1100),
    });
  }

  function finishBuild(lotId, type) {
    const App = global.App;
    const b = TD().BY_ID[type];
    const t = Town.state();
    if (global.document.getElementById('modal').hidden || Town.buildingAt(lotId)) return;
    if (App.state.dna < b.cost) {
      App.closeModal();
      return needMore(b.cost - App.state.dna);
    }
    App.state.dna -= b.cost;
    t.buildings.push({ lot: lotId, type, floors: 1, rooms: [{ slot: 0, type: b.room, lvl: 1 }], t: Date.now() });
    t.stars += 3;
    App.save();
    App.refreshHud();
    App.closeModal();
    if (global.World.refreshTown) global.World.refreshTown(lotId);
    setTimeout(() => {
      App.celebrate({
        title: `🎉 ${b.name} ${b.f ? 'חֲדָשָׁה' : 'חָדָשׁ'} בָּעִיר!`,
        dinoHtml: `<div class="tc-big">${TD().svg(type)}</div>`,
        lines: ['בְּקָרוֹב אֶפְשָׁר יִהְיֶה לְהִכָּנֵס פְּנִימָה וְלִבְנוֹת חֲדָרִים! 🚪'],
      });
    }, 2700);
  }

  function openBuilding(lotId) {
    const App = global.App;
    const b = TD().BY_ID[Town.buildingAt(lotId).type];
    modal(`
      <h2>${b.look.sign} ${b.name}</h2>
      <div class="tc-big">${TD().svg(b.id)}</div>
      <p class="tc-desc">${b.desc}</p>
      <p class="muted">🚪 בְּקָרוֹב אֶפְשָׁר יִהְיֶה לְהִכָּנֵס פְּנִימָה וְלִבְנוֹת חֲדָרִים!</p>
      <div class="row"><button class="btn small" data-say>🔊 הַקְרֵא לִי</button><button class="btn ghost" data-close>סְגִירָה</button></div>`, (e) => {
      if (e.target.closest('[data-say]')) App.speak(`${noEmoji(b.name)}. ${noEmoji(b.desc)}`);
    });
  }

  global.Town = Town;
})(window);
